/*
 * Copyright (C) 2018-2020 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { joi, apiVersionSchema, joiUserIdentifier, joiIdentifier, CustomObjectSchema, DeepPrimitiveMap } from "./common"
import { baseModuleSpecSchema, BaseModuleSpec, ModuleConfig } from "./module"
import { dedent, deline } from "../util/string"
import { GardenResource, prepareModuleResource } from "./base"
import { DOCS_BASE_URL } from "../constants"
import { ProjectConfigContext, BundleConfigContext } from "./config-context"
import { resolveTemplateStrings } from "../template-string"
import { validateWithPath } from "./validation"
import { Garden } from "../garden"
import { ConfigurationError } from "../exceptions"
import { resolve, posix, dirname } from "path"
import { readFile, ensureDir } from "fs-extra"
import Bluebird from "bluebird"

const inputTemplatePattern = "${inputs.*}"
const bundleNameTemplate = "${bundle.name}"
const bundleTemplateNameTemplate = "${bundle.templateName}"
const moduleTemplateReferenceUrl = DOCS_BASE_URL + "/reference/template-strings#module-configuration-context"

export const templateKind = "BundleTemplate"
export const bundleKind = "Bundle"

export type TemplateKind = typeof templateKind
export type BundleKind = typeof bundleKind

interface BundleModuleSpec extends Partial<BaseModuleSpec> {
  type: string
}

export interface BundleTemplateResource extends GardenResource {
  inputsSchemaPath?: string
  modules?: BundleModuleSpec[]
}

export interface BundleTemplateConfig extends BundleTemplateResource {
  inputsSchema: CustomObjectSchema
}

export interface BundleResource extends GardenResource {
  template: string
  inputs?: DeepPrimitiveMap
}

export interface BundleConfig extends BundleResource {
  modules: ModuleConfig[]
}

export async function resolveBundleTemplate(
  garden: Garden,
  resource: BundleTemplateResource
): Promise<BundleTemplateConfig> {
  // Resolve template strings, minus module templates and files
  const partial = {
    ...resource,
    modules: [],
  }
  const context = new ProjectConfigContext(garden)
  const resolved = resolveTemplateStrings(partial, context)

  // Validate the partial config
  const validated = validateWithPath({
    config: resolved,
    path: resource.configPath || resource.path,
    schema: bundleTemplateSchema(),
    projectRoot: garden.projectRoot,
    configType: templateKind,
  })

  // Read and validate the JSON schema, if specified
  // -> default to object with no properties
  let inputsJsonSchema = {
    type: "object",
    additionalProperties: false,
  }

  const configDir = resource.configPath ? dirname(resource.configPath) : resource.path

  if (validated.inputsSchemaPath) {
    const path = resolve(configDir, ...validated.inputsSchemaPath.split(posix.sep))
    try {
      inputsJsonSchema = JSON.parse((await readFile(path)).toString())
    } catch (error) {
      throw new ConfigurationError(`Unable to read inputs schema for ${templateKind} ${validated.name}: ${error}`, {
        path,
        error,
      })
    }

    const type = inputsJsonSchema?.type

    if (type !== "object") {
      throw new ConfigurationError(
        `Inputs schema for ${templateKind} ${validated.name} has type ${type}, but should be "object".`,
        { path, type }
      )
    }
  }

  // Add the module templates back and return
  return {
    ...validated,
    inputsSchema: joi.object().jsonSchema(inputsJsonSchema),
    modules: resource.modules,
  }
}

export async function resolveBundle(
  garden: Garden,
  config: BundleResource,
  templates: { [name: string]: BundleTemplateConfig }
): Promise<BundleConfig> {
  // Resolve template strings for fields
  const resolved = resolveTemplateStrings(config, new ProjectConfigContext(garden))

  // Validate
  let bundle = validateWithPath({
    config: resolved,
    configType: bundleKind,
    path: resolved.configPath || resolved.path,
    schema: bundleSchema(),
    projectRoot: garden.projectRoot,
  })

  const template = templates[bundle.template]

  if (!template) {
    const availableTemplates = Object.keys(templates)
    throw new ConfigurationError(
      deline`
      ${bundleKind} ${bundle.name} references template ${bundle.template},
      which cannot be found. Available templates: ${availableTemplates.join(", ")}
      `,
      { availableTemplates }
    )
  }

  // Validate template inputs
  bundle = validateWithPath({
    config: resolved,
    configType: bundleKind,
    path: resolved.configPath || resolved.path,
    schema: bundleSchema().keys({ inputs: template.inputsSchema }),
    projectRoot: garden.projectRoot,
  })

  const inputs = bundle.inputs || {}

  // Resolve files and write
  // TODO: consider shifting this to ResolveModuleTask?
  const context = new BundleConfigContext({
    ...garden,
    bundleName: bundle.name,
    templateName: template.name,
    inputs,
  })

  // Prepare modules and resolve templated names
  const modules = await Bluebird.map(template.modules || [], async (m) => {
    // Run a partial template resolution with the bundle/template info and inputs
    const spec = resolveTemplateStrings(m, context, { allowPartial: true })

    let moduleConfig: ModuleConfig

    try {
      moduleConfig = prepareModuleResource(spec, bundle.configPath || bundle.path, garden.projectRoot)
    } catch (error) {
      throw new ConfigurationError(
        deline`${templateKind} ${template.name} returned an invalid module (named ${spec.name})
        for ${bundleKind} ${bundle.name}: ${error.message}`,
        {
          moduleSpec: spec,
          bundle,
          error,
        }
      )
    }

    // Resolve the file source path to an absolute path, so that it can be used during module resolution
    moduleConfig.generateFiles = (moduleConfig.generateFiles || []).map((f) => ({
      ...f,
      sourcePath: f.sourcePath && resolve(template.path, ...f.sourcePath.split(posix.sep)),
    }))

    // If a path is set, resolve the path and ensure that directory exists
    if (spec.path) {
      moduleConfig.path = resolve(bundle.path, ...spec.path.split(posix.sep))
      await ensureDir(moduleConfig.path)
    }

    // Attach metadata
    moduleConfig.bundleName = bundle.name
    moduleConfig.bundleTemplateName = template.name
    moduleConfig.inputs = inputs

    return moduleConfig
  })

  return { ...bundle, modules }
}

export const bundleTemplateSchema = () =>
  joi.object().keys({
    apiVersion: apiVersionSchema(),
    kind: joi.string().allow(templateKind).only().default(templateKind),
    name: joiUserIdentifier().description("The name of the template."),
    path: joi.string().description(`The directory path of the ${templateKind}.`).meta({ internal: true }),
    configPath: joi.string().description(`The path of the ${templateKind} config file.`).meta({ internal: true }),
    inputsSchemaPath: joi
      .posixPath()
      .relativeOnly()
      .description(
        "Path to a JSON schema file describing the expected inputs for the template. Must be an object schema. If none is provided, no inputs will be accepted and an error thrown if attempting to do so."
      ),
    modules: joi
      .array()
      .items(moduleTemplateSchema())
      .description(
        dedent`
        A list of modules this template will output. The schema for each is the same as when you create modules normally in configuration files, with the addition of a \`path\` field, which allows you to specify a sub-directory to set as the module root.

        In addition to any template strings you can normally use for modules (see [the reference](${moduleTemplateReferenceUrl})), you can reference the inputs described by the inputs schema for the template, using ${inputTemplatePattern} template strings, as well as ${bundleNameTemplate} and ${bundleTemplateNameTemplate}, to reference the name of the ${bundleKind} using the template, and the name of the template itself, respectively. This also applies to file contents specified under the \`files\` key.

        **Important: Make sure you use templates for any identifiers that must be unique, such as module names, service names and task names. Otherwise you'll inevitably run into configuration errors. The module names can reference the ${inputTemplatePattern}, ${bundleNameTemplate} and ${bundleTemplateNameTemplate} keys. Other identifiers can also reference those, plus any other keys available for module templates (see [the module context reference](${moduleTemplateReferenceUrl})).**
        `
      ),
  })

export const bundleSchema = () =>
  joi.object().keys({
    apiVersion: apiVersionSchema(),
    kind: joi.string().allow(bundleKind).only().default(bundleKind),
    name: joiUserIdentifier().required().description("The name of the bundle."),
    path: joi.string().description(`The directory path of the ${bundleKind}.`).meta({ internal: true }),
    configPath: joi.string().description(`The path of the ${bundleKind} config file.`).meta({ internal: true }),
    template: joiIdentifier().required().description(`The ${templateKind} to use to generate this ${bundleKind}`),
    inputs: joi.object().description(
      dedent`
        A map of inputs to pass to the ${templateKind}. These must match the inputs schema of the ${templateKind}.
      `
    ),
  })

const moduleTemplateSchema = () =>
  baseModuleSpecSchema().keys({
    path: joi
      .posixPath()
      .relativeOnly()
      .subPathOnly()
      .description(
        "POSIX-style path of a sub-directory to set as the module root. If the directory does not exist, it is automatically created."
      ),
  })
