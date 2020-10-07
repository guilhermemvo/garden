---
order: 43
title: Bundle Template Configuration
---

# Bundle Template Configuration Reference

Below is the schema reference for `BundleTemplate` configuration files. To learn more about bundles and bundle templates, see the [Bundles guide](../using-garden/bundles.md).

The reference is divided into two sections:
* [YAML Schema](#yaml-schema) contains the config YAML schema
* [Configuration keys](#configuration-keys) describes each individual schema key for the configuration files.

Also check out the [Bundle reference](./bundle-config.md).

## YAML Schema

The values in the schema below are the default values.

```yaml
# The schema version of this config (currently not used).
apiVersion: garden.io/v0

kind: BundleTemplate

# The name of the template.
name:

# Path to a JSON schema file describing the expected inputs for the template. Must be an object schema. If none is
# provided, no inputs will be accepted and an error thrown if attempting to do so.
inputsSchemaPath:

# A list of modules this template will output. The schema for each is the same as when you create modules normally in
# configuration files, with the addition of a `path` field, which allows you to specify a sub-directory to set as the
# module root.
#
# In addition to any template strings you can normally use for modules (see [the
# reference](https://docs.garden.io/reference/template-strings#module-configuration-context)), you can reference the
# inputs described by the inputs schema for the template, using ${inputs.*} template strings, as well as
# ${bundle.name} and ${bundle.templateName}, to reference the name of the Bundle using the template, and the name of
# the template itself, respectively. This also applies to file contents specified under the `files` key.
#
# **Important: Make sure you use templates for any identifiers that must be unique, such as module names, service
# names and task names. Otherwise you'll inevitably run into configuration errors. The module names can reference the
# ${inputs.*}, ${bundle.name} and ${bundle.templateName} keys. Other identifiers can also reference those, plus any
# other keys available for module templates (see [the module context
# reference](https://docs.garden.io/reference/template-strings#module-configuration-context)).**
modules:
  - # The schema version of this config (currently not used).
    apiVersion: garden.io/v0

    kind: Module

    # The type of this module.
    type:

    # The name of this module.
    name:

    # Specify how to build the module. Note that plugins may define additional keys on this object.
    build:
      # A list of modules that must be built before this module is built.
      dependencies:
        - # Module name to build ahead of this module.
          name:

          # Specify one or more files or directories to copy from the built dependency to this module.
          copy:
            - # POSIX-style path or filename of the directory or file(s) to copy to the target.
              source:

              # POSIX-style path or filename to copy the directory or file(s), relative to the build directory.
              # Defaults to to same as source path.
              target: ''

    # A description of the module.
    description:

    # Set this to `true` to disable the module. You can use this with conditional template strings to disable modules
    # based on, for example, the current environment or other variables (e.g. `disabled: \${environment.name ==
    # "prod"}`). This can be handy when you only need certain modules for specific environments, e.g. only for
    # development.
    #
    # Disabling a module means that any services, tasks and tests contained in it will not be deployed or run. It also
    # means that the module is not built _unless_ it is declared as a build dependency by another enabled module (in
    # which case building this module is necessary for the dependant to be built).
    #
    # If you disable the module, and its services, tasks or tests are referenced as _runtime_ dependencies, Garden
    # will automatically ignore those dependency declarations. Note however that template strings referencing the
    # module's service or task outputs (i.e. runtime outputs) will fail to resolve when the module is disabled, so you
    # need to make sure to provide alternate values for those if you're using them, using conditional expressions.
    disabled: false

    # Specify a list of POSIX-style paths or globs that should be regarded as the source files for this module. Files
    # that do *not* match these paths or globs are excluded when computing the version of the module, when responding
    # to filesystem watch events, and when staging builds.
    #
    # Note that you can also _exclude_ files using the `exclude` field or by placing `.gardenignore` files in your
    # source tree, which use the same format as `.gitignore` files. See the [Configuration Files
    # guide](https://docs.garden.io/using-garden/configuration-overview#including-excluding-files-and-directories) for
    # details.
    #
    # Also note that specifying an empty list here means _no sources_ should be included.
    include:

    # Specify a list of POSIX-style paths or glob patterns that should be excluded from the module. Files that match
    # these paths or globs are excluded when computing the version of the module, when responding to filesystem watch
    # events, and when staging builds.
    #
    # Note that you can also explicitly _include_ files using the `include` field. If you also specify the `include`
    # field, the files/patterns specified here are filtered from the files matched by `include`. See the
    # [Configuration Files
    # guide](https://docs.garden.io/using-garden/configuration-overview#including-excluding-files-and-directories) for
    # details.
    #
    # Unlike the `modules.exclude` field in the project config, the filters here have _no effect_ on which files and
    # directories are watched for changes. Use the project `modules.exclude` field to affect those, if you have large
    # directories that should not be watched for changes.
    exclude:

    # A remote repository URL. Currently only supports git servers. Must contain a hash suffix pointing to a specific
    # branch or tag, with the format: <git remote url>#<branch|tag>
    #
    # Garden will import the repository source code into this module, but read the module's config from the local
    # garden.yml file.
    repositoryUrl:

    # When false, disables pushing this module to remote registries.
    allowPublish: true

    # A list of files to write to the module directory when resolving this module. This is useful to automatically
    # generate (and template) any supporting files needed for the module.
    generateFiles:
      - # POSIX-style filename to read the source file contents from, relative to the path of the BundleTemplate
        # configuration file.
        # This file may contain template strings, much like any other field in the configuration.
        sourcePath:

        # POSIX-style filename to write the resolved file contents to, relative to the path of the Bundle that
        # references the template.
        #
        # Note that any existing file with the same name will be overwritten. If the path contains one or more
        # directories, they will be automatically created if missing.
        targetPath:

        # The desired file contents as a string.
        value:

    # POSIX-style path of a sub-directory to set as the module root. If the directory does not exist, it is
    # automatically created.
    path:
```

## Configuration Keys


### `apiVersion`

The schema version of this config (currently not used).

| Type     | Allowed Values | Default          | Required |
| -------- | -------------- | ---------------- | -------- |
| `string` | "garden.io/v0" | `"garden.io/v0"` | Yes      |

### `kind`

| Type     | Allowed Values   | Default            | Required |
| -------- | ---------------- | ------------------ | -------- |
| `string` | "BundleTemplate" | `"BundleTemplate"` | Yes      |

### `name`

The name of the template.

| Type     | Required |
| -------- | -------- |
| `string` | No       |

### `inputsSchemaPath`

Path to a JSON schema file describing the expected inputs for the template. Must be an object schema. If none is provided, no inputs will be accepted and an error thrown if attempting to do so.

| Type        | Required |
| ----------- | -------- |
| `posixPath` | No       |

### `modules[]`

A list of modules this template will output. The schema for each is the same as when you create modules normally in configuration files, with the addition of a `path` field, which allows you to specify a sub-directory to set as the module root.

In addition to any template strings you can normally use for modules (see [the reference](https://docs.garden.io/reference/template-strings#module-configuration-context)), you can reference the inputs described by the inputs schema for the template, using ${inputs.*} template strings, as well as ${bundle.name} and ${bundle.templateName}, to reference the name of the Bundle using the template, and the name of the template itself, respectively. This also applies to file contents specified under the `files` key.

**Important: Make sure you use templates for any identifiers that must be unique, such as module names, service names and task names. Otherwise you'll inevitably run into configuration errors. The module names can reference the ${inputs.*}, ${bundle.name} and ${bundle.templateName} keys. Other identifiers can also reference those, plus any other keys available for module templates (see [the module context reference](https://docs.garden.io/reference/template-strings#module-configuration-context)).**

| Type            | Required |
| --------------- | -------- |
| `array[object]` | No       |

### `modules[].apiVersion`

[modules](#modules) > apiVersion

The schema version of this config (currently not used).

| Type     | Allowed Values | Default          | Required |
| -------- | -------------- | ---------------- | -------- |
| `string` | "garden.io/v0" | `"garden.io/v0"` | Yes      |

### `modules[].kind`

[modules](#modules) > kind

| Type     | Allowed Values | Default    | Required |
| -------- | -------------- | ---------- | -------- |
| `string` | "Module"       | `"Module"` | Yes      |

### `modules[].type`

[modules](#modules) > type

The type of this module.

| Type     | Required |
| -------- | -------- |
| `string` | Yes      |

Example:

```yaml
modules:
  - type: "container"
```

### `modules[].name`

[modules](#modules) > name

The name of this module.

| Type     | Required |
| -------- | -------- |
| `string` | Yes      |

Example:

```yaml
modules:
  - name: "my-sweet-module"
```

### `modules[].build`

[modules](#modules) > build

Specify how to build the module. Note that plugins may define additional keys on this object.

| Type     | Default               | Required |
| -------- | --------------------- | -------- |
| `object` | `{"dependencies":[]}` | No       |

### `modules[].build.dependencies[]`

[modules](#modules) > [build](#modulesbuild) > dependencies

A list of modules that must be built before this module is built.

| Type            | Default | Required |
| --------------- | ------- | -------- |
| `array[object]` | `[]`    | No       |

Example:

```yaml
modules:
  - build:
      ...
      dependencies:
        - name: some-other-module-name
```

### `modules[].build.dependencies[].name`

[modules](#modules) > [build](#modulesbuild) > [dependencies](#modulesbuilddependencies) > name

Module name to build ahead of this module.

| Type     | Required |
| -------- | -------- |
| `string` | Yes      |

### `modules[].build.dependencies[].copy[]`

[modules](#modules) > [build](#modulesbuild) > [dependencies](#modulesbuilddependencies) > copy

Specify one or more files or directories to copy from the built dependency to this module.

| Type            | Default | Required |
| --------------- | ------- | -------- |
| `array[object]` | `[]`    | No       |

### `modules[].build.dependencies[].copy[].source`

[modules](#modules) > [build](#modulesbuild) > [dependencies](#modulesbuilddependencies) > [copy](#modulesbuilddependenciescopy) > source

POSIX-style path or filename of the directory or file(s) to copy to the target.

| Type        | Required |
| ----------- | -------- |
| `posixPath` | Yes      |

### `modules[].build.dependencies[].copy[].target`

[modules](#modules) > [build](#modulesbuild) > [dependencies](#modulesbuilddependencies) > [copy](#modulesbuilddependenciescopy) > target

POSIX-style path or filename to copy the directory or file(s), relative to the build directory.
Defaults to to same as source path.

| Type        | Default | Required |
| ----------- | ------- | -------- |
| `posixPath` | `""`    | No       |

### `modules[].description`

[modules](#modules) > description

A description of the module.

| Type     | Required |
| -------- | -------- |
| `string` | No       |

### `modules[].disabled`

[modules](#modules) > disabled

Set this to `true` to disable the module. You can use this with conditional template strings to disable modules based on, for example, the current environment or other variables (e.g. `disabled: \${environment.name == "prod"}`). This can be handy when you only need certain modules for specific environments, e.g. only for development.

Disabling a module means that any services, tasks and tests contained in it will not be deployed or run. It also means that the module is not built _unless_ it is declared as a build dependency by another enabled module (in which case building this module is necessary for the dependant to be built).

If you disable the module, and its services, tasks or tests are referenced as _runtime_ dependencies, Garden will automatically ignore those dependency declarations. Note however that template strings referencing the module's service or task outputs (i.e. runtime outputs) will fail to resolve when the module is disabled, so you need to make sure to provide alternate values for those if you're using them, using conditional expressions.

| Type      | Default | Required |
| --------- | ------- | -------- |
| `boolean` | `false` | No       |

### `modules[].include[]`

[modules](#modules) > include

Specify a list of POSIX-style paths or globs that should be regarded as the source files for this module. Files that do *not* match these paths or globs are excluded when computing the version of the module, when responding to filesystem watch events, and when staging builds.

Note that you can also _exclude_ files using the `exclude` field or by placing `.gardenignore` files in your source tree, which use the same format as `.gitignore` files. See the [Configuration Files guide](https://docs.garden.io/using-garden/configuration-overview#including-excluding-files-and-directories) for details.

Also note that specifying an empty list here means _no sources_ should be included.

| Type               | Required |
| ------------------ | -------- |
| `array[posixPath]` | No       |

Example:

```yaml
modules:
  - include:
      - Dockerfile
      - my-app.js
```

### `modules[].exclude[]`

[modules](#modules) > exclude

Specify a list of POSIX-style paths or glob patterns that should be excluded from the module. Files that match these paths or globs are excluded when computing the version of the module, when responding to filesystem watch events, and when staging builds.

Note that you can also explicitly _include_ files using the `include` field. If you also specify the `include` field, the files/patterns specified here are filtered from the files matched by `include`. See the [Configuration Files guide](https://docs.garden.io/using-garden/configuration-overview#including-excluding-files-and-directories) for details.

Unlike the `modules.exclude` field in the project config, the filters here have _no effect_ on which files and directories are watched for changes. Use the project `modules.exclude` field to affect those, if you have large directories that should not be watched for changes.

| Type               | Required |
| ------------------ | -------- |
| `array[posixPath]` | No       |

Example:

```yaml
modules:
  - exclude:
      - tmp/**/*
      - '*.log'
```

### `modules[].repositoryUrl`

[modules](#modules) > repositoryUrl

A remote repository URL. Currently only supports git servers. Must contain a hash suffix pointing to a specific branch or tag, with the format: <git remote url>#<branch|tag>

Garden will import the repository source code into this module, but read the module's config from the local garden.yml file.

| Type              | Required |
| ----------------- | -------- |
| `gitUrl | string` | No       |

Example:

```yaml
modules:
  - repositoryUrl: "git+https://github.com/org/repo.git#v2.0"
```

### `modules[].allowPublish`

[modules](#modules) > allowPublish

When false, disables pushing this module to remote registries.

| Type      | Default | Required |
| --------- | ------- | -------- |
| `boolean` | `true`  | No       |

### `modules[].generateFiles[]`

[modules](#modules) > generateFiles

A list of files to write to the module directory when resolving this module. This is useful to automatically generate (and template) any supporting files needed for the module.

| Type            | Required |
| --------------- | -------- |
| `array[object]` | No       |

### `modules[].generateFiles[].sourcePath`

[modules](#modules) > [generateFiles](#modulesgeneratefiles) > sourcePath

POSIX-style filename to read the source file contents from, relative to the path of the BundleTemplate configuration file.
This file may contain template strings, much like any other field in the configuration.

| Type        | Required |
| ----------- | -------- |
| `posixPath` | No       |

### `modules[].generateFiles[].targetPath`

[modules](#modules) > [generateFiles](#modulesgeneratefiles) > targetPath

POSIX-style filename to write the resolved file contents to, relative to the path of the Bundle that references the template.

Note that any existing file with the same name will be overwritten. If the path contains one or more directories, they will be automatically created if missing.

| Type        | Required |
| ----------- | -------- |
| `posixPath` | Yes      |

### `modules[].generateFiles[].value`

[modules](#modules) > [generateFiles](#modulesgeneratefiles) > value

The desired file contents as a string.

| Type     | Required |
| -------- | -------- |
| `string` | No       |

### `modules[].path`

[modules](#modules) > path

POSIX-style path of a sub-directory to set as the module root. If the directory does not exist, it is automatically created.

| Type        | Required |
| ----------- | -------- |
| `posixPath` | No       |

