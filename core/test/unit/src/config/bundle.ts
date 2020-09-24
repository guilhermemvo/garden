/*
 * Copyright (C) 2018-2020 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { expect } from "chai"
import { DEFAULT_API_VERSION } from "../../../../src/constants"
import { expectError, TestGarden, getDataDir, makeTestGarden } from "../../../helpers"
import stripAnsi from "strip-ansi"
import {
  BundleTemplateResource,
  resolveBundleTemplate,
  BundleResource,
  BundleTemplateConfig,
  resolveBundle,
} from "../../../../src/config/bundle"
import { resolve } from "path"
import { joi } from "../../../../src/config/common"
import { pathExists, remove } from "fs-extra"

describe("bundle configs and templates", () => {
  let garden: TestGarden

  const projectRoot = getDataDir("test-projects", "bundles")

  before(async () => {
    garden = await makeTestGarden(projectRoot)
  })

  describe("resolveBundleTemplate", () => {
    const defaults = {
      apiVersion: DEFAULT_API_VERSION,
      kind: "BundleTemplate",
      name: "test",
      path: projectRoot,
      configPath: resolve(projectRoot, "templates.garden.yml"),
    }

    it("resolves template strings for fields other than modules and files", async () => {
      const config: BundleTemplateResource = {
        ...defaults,
        inputsSchemaPath: "${project.name}.json",
      }
      const resolved = await resolveBundleTemplate(garden, config)
      expect(resolved.inputsSchemaPath).to.eql("bundles.json")
    })

    it("ignores template strings in modules", async () => {
      const config: BundleTemplateResource = {
        ...defaults,
        modules: [
          {
            type: "test",
            name: "${inputs.foo}",
          },
        ],
      }
      const resolved = await resolveBundleTemplate(garden, config)
      expect(resolved.modules).to.eql(config.modules)
    })

    it("throws on an invalid schema", async () => {
      const config: any = {
        ...defaults,
        foo: "bar",
      }
      await expectError(
        () => resolveBundleTemplate(garden, config),
        (err) =>
          expect(stripAnsi(err.message)).to.equal(
            'Error validating BundleTemplate (templates.garden.yml): key "foo" is not allowed at path [foo]'
          )
      )
    })

    it("defaults to an empty object schema for inputs", async () => {
      const config: BundleTemplateResource = {
        ...defaults,
      }
      const resolved = await resolveBundleTemplate(garden, config)
      expect((<any>resolved.inputsSchema)._rules[0].args.jsonSchema.schema).to.eql({
        type: "object",
        additionalProperties: false,
      })
    })

    it("parses a valid JSON inputs schema", async () => {
      const config: BundleTemplateResource = {
        ...defaults,
        inputsSchemaPath: "bundles.json",
      }
      const resolved = await resolveBundleTemplate(garden, config)
      expect(resolved.inputsSchema).to.exist
    })

    it("throws if inputs schema cannot be found", async () => {
      const config: BundleTemplateResource = {
        ...defaults,
        inputsSchemaPath: "foo.json",
      }
      const path = resolve(config.path, config.inputsSchemaPath!)
      await expectError(
        () => resolveBundleTemplate(garden, config),
        (err) =>
          expect(stripAnsi(err.message)).to.equal(
            `Unable to read inputs schema for BundleTemplate test: Error: ENOENT: no such file or directory, open '${path}'`
          )
      )
    })

    it("throws if an invalid JSON schema is provided", async () => {
      const config: BundleTemplateResource = {
        ...defaults,
        inputsSchemaPath: "invalid.json",
      }
      await expectError(
        () => resolveBundleTemplate(garden, config),
        (err) =>
          expect(stripAnsi(err.message)).to.equal(
            `Inputs schema for BundleTemplate test has type string, but should be "object".`
          )
      )
    })
  })

  describe("resolveBundle", () => {
    const template: BundleTemplateConfig = {
      apiVersion: DEFAULT_API_VERSION,
      kind: "BundleTemplate",
      name: "test",
      path: projectRoot,
      configPath: resolve(projectRoot, "modules.garden.yml"),
      inputsSchema: joi.object().keys({
        foo: joi.string(),
      }),
      modules: [],
    }

    const templates = {
      test: template,
    }

    const defaults = {
      apiVersion: DEFAULT_API_VERSION,
      kind: "Bundle",
      name: "test",
      path: projectRoot,
      configPath: resolve(projectRoot, "modules.garden.yml"),
      template: "test",
    }

    it("resolves template strings on the bundle config", async () => {
      const config: BundleResource = {
        ...defaults,
        inputs: {
          foo: "${project.name}",
        },
      }
      const resolved = await resolveBundle(garden, config, templates)
      expect(resolved.inputs?.foo).to.equal("bundles")
    })

    it("resolves all bundle and input template strings, ignoring others", async () => {
      const _templates = {
        test: {
          ...template,
          modules: [
            {
              type: "test",
              name: "${bundle.name}-${bundle.templateName}-${inputs.foo}",
              build: {
                dependencies: [{ name: "${bundle.name}-${bundle.templateName}-foo", copy: [] }],
              },
              image: "${modules.foo.outputs.bar || inputs.foo}",
            },
          ],
        },
      }
      const config: BundleResource = {
        ...defaults,
        inputs: {
          foo: "bar",
        },
      }

      const resolved = await resolveBundle(garden, config, _templates)
      const module = resolved.modules[0]

      expect(module.name).to.equal("test-test-bar")
      expect(module.build.dependencies).to.eql([{ name: "test-test-foo", copy: [] }])
      expect(module.spec.image).to.equal("${modules.foo.outputs.bar || inputs.foo}")
    })

    it("throws if bundle is invalid", async () => {
      const config: any = {
        ...defaults,
        foo: "bar",
      }
      await expectError(
        () => resolveBundle(garden, config, templates),
        (err) =>
          expect(stripAnsi(err.message)).to.equal(
            'Error validating Bundle (modules.garden.yml): key "foo" is not allowed at path [foo]'
          )
      )
    })

    it("throws if template cannot be found", async () => {
      const config: BundleResource = {
        ...defaults,
        template: "foo",
      }
      await expectError(
        () => resolveBundle(garden, config, templates),
        (err) =>
          expect(stripAnsi(err.message)).to.equal(
            "Bundle test references template foo, which cannot be found. Available templates: test"
          )
      )
    })

    it("throws if inputs don't match inputs schema", async () => {
      const config: BundleResource = {
        ...defaults,
        inputs: { foo: 123 },
      }
      await expectError(
        () => resolveBundle(garden, config, templates),
        (err) =>
          expect(stripAnsi(err.message)).to.equal(
            "Error validating Bundle (modules.garden.yml): key .inputs.foo must be a string"
          )
      )
    })

    it("fully resolves the source path on module files", async () => {
      const _templates = {
        test: {
          ...template,
          modules: [
            {
              type: "test",
              name: "foo",
              generateFiles: [{ sourcePath: "foo/bar.txt", targetPath: "foo.txt" }],
            },
          ],
        },
      }
      const config: BundleResource = {
        ...defaults,
        inputs: {
          foo: "bar",
        },
      }

      const resolved = await resolveBundle(garden, config, _templates)

      const absPath = resolve(config.path, "foo", "bar.txt")
      expect(resolved.modules[0].generateFiles![0].sourcePath).to.equal(absPath)
    })

    it("creates the module path directory, if necessary", async () => {
      const absPath = resolve(projectRoot, ".garden", "foo")
      await remove(absPath)

      const _templates = {
        test: {
          ...template,
          modules: [
            {
              type: "test",
              name: "foo",
              path: `.garden/foo`,
            },
          ],
        },
      }
      const config: BundleResource = {
        ...defaults,
        inputs: {
          foo: "bar",
        },
      }

      const resolved = await resolveBundle(garden, config, _templates)
      const module = resolved.modules[0]

      expect(module.path).to.equal(absPath)
      expect(await pathExists(module.path)).to.be.true
    })

    it("attaches bundle metadata to the output modules", async () => {
      const _templates = {
        test: {
          ...template,
          modules: [
            {
              type: "test",
              name: "foo",
            },
          ],
        },
      }
      const config: BundleResource = {
        ...defaults,
        inputs: {
          foo: "bar",
        },
      }

      const resolved = await resolveBundle(garden, config, _templates)

      expect(resolved.modules[0].bundleName).to.equal(config.name)
      expect(resolved.modules[0].bundleTemplateName).to.equal(template.name)
      expect(resolved.modules[0].inputs).to.eql(config.inputs)
    })

    it("resolves template strings in template module names", async () => {
      const _templates = {
        test: {
          ...template,
          modules: [
            {
              type: "test",
              name: "${inputs.foo}",
            },
          ],
        },
      }
      const config: BundleResource = {
        ...defaults,
        inputs: {
          foo: "bar",
        },
      }

      const resolved = await resolveBundle(garden, config, _templates)

      expect(resolved.modules[0].name).to.equal("bar")
    })

    it("throws if an invalid module spec is in the template", async () => {
      const _templates: any = {
        test: {
          ...template,
          modules: [
            {
              type: 123,
              name: "foo",
            },
          ],
        },
      }
      const config: BundleResource = {
        ...defaults,
      }
      await expectError(
        () => resolveBundle(garden, config, _templates),
        (err) =>
          expect(stripAnsi(err.message)).to.equal(
            "BundleTemplate test returned an invalid module (named foo) for Bundle test: Error validating module (modules.garden.yml): key .type must be a string"
          )
      )
    })

    it("throws if a module spec has an invalid name", async () => {
      const _templates: any = {
        test: {
          ...template,
          modules: [
            {
              type: "test",
              name: 123,
            },
          ],
        },
      }
      const config: BundleResource = {
        ...defaults,
      }
      await expectError(
        () => resolveBundle(garden, config, _templates),
        (err) =>
          expect(stripAnsi(err.message)).to.equal(
            "BundleTemplate test returned an invalid module (named 123) for Bundle test: Error validating module (modules.garden.yml): key .name must be a string"
          )
      )
    })
  })
})
