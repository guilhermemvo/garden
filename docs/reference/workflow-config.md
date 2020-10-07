---
order: 45
title: Workflow Configuration
---

# Workflow Configuration Reference

Below is the schema reference for [Workflow](../using-garden/workflows.md) configuration files. For an introduction to configuring a Garden project, please look at our [configuration guide](../using-garden/configuration-overview.md).

The reference is divided into two sections:
* [YAML Schema](#yaml-schema) contains the config YAML schema
* [Configuration keys](#configuration-keys) describes each individual schema key for the configuration files.

## YAML Schema

The values in the schema below are the default values.

```yaml
# The schema version of this workflow's config (currently not used).
apiVersion: garden.io/v0

kind: Workflow

# The name of this workflow.
name:

# A description of the workflow.
description:

# A list of files to write before starting the workflow.
#
# This is useful to e.g. create files required for provider authentication, and can be created from data stored in
# secrets or templated strings.
#
# Note that you cannot reference provider configuration in template strings within this field, since they are resolved
# after these files are generated. This means you can reference the files specified here in your provider
# configurations.
files:
  - # POSIX-style path to write the file to, relative to the project root (or absolute). If the path contains one
    # or more directories, they are created automatically if necessary.
    # If any of those directories conflict with existing file paths, or if the file path conflicts with an existing
    # directory path, an error will be thrown.
    # **Any existing file with the same path will be overwritten, so be careful not to accidentally accidentally
    # overwrite files unrelated to your workflow.**
    path:

    # The file data as a string.
    data:

    # The name of a Garden secret to copy the file data from (Garden Enterprise only).
    secretName:

# The number of hours to keep the workflow pod running after completion.
keepAliveHours: 48

limits:
  # The maximum amount of CPU the workflow pod can use, in millicpus (i.e. 1000 = 1 CPU)
  cpu: 1000

  # The maximum amount of RAM the workflow pod can use, in megabytes (i.e. 1024 = 1 GB)
  memory: 1024

# The steps the workflow should run. At least one step is required. Steps are run sequentially. If a step fails,
# subsequent steps are skipped.
steps:
  - # An identifier to assign to this step. If none is specified, this defaults to "step-<number of step>", where
    # <number of step> is the sequential number of the step (first step being number 1).
    #
    # This identifier is useful when referencing command outputs in following steps. For example, if you set this
    # to "my-step", following steps can reference the \${steps.my-step.outputs.*} key in the `script` or `command`
    # fields.
    name:

    # A Garden command this step should run, followed by any required or optional arguments and flags.
    # Arguments and options for the commands may be templated, including references to previous steps, but for now
    # the commands themselves (as listed below) must be hard-coded.
    #
    # Supported commands:
    #
    # `[build]`
    # `[delete, environment]`
    # `[delete, service]`
    # `[deploy]`
    # `[exec]`
    # `[get, config]`
    # `[get, outputs]`
    # `[get, status]`
    # `[get, task-result]`
    # `[get, test-result]`
    # `[link, module]`
    # `[link, source]`
    # `[publish]`
    # `[run, task]`
    # `[run, test]`
    # `[test]`
    # `[update-remote, all]`
    # `[update-remote, modules]`
    # `[update-remote, sources]`
    #
    #
    command:

    # A description of the workflow step.
    description:

    # A bash script to run. Note that the host running the workflow must have bash installed and on path.
    # It is considered to have run successfully if it returns an exit code of 0. Any other exit code signals an error,
    # and the remainder of the workflow is aborted.
    #
    # The script may include template strings, including references to previous steps.
    script:

    # Set to true to skip this step. Use this with template conditionals to skip steps for certain environments or
    # scenarios.
    skip: false

# A list of triggers that determine when the workflow should be run, and which environment should be used (Garden
# Enterprise only).
triggers:
  - # The environment name (from your project configuration) to use for the workflow when matched by this trigger.
    environment:

    # The namespace to use for the workflow when matched by this trigger. Follows the namespacing setting used for
    # this trigger's environment, as defined in your project's environment configs.
    namespace:

    # A list of [GitHub events](https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads)
    # that should trigger this workflow.
    #
    # Supported events:
    #
    # `create`, `pull-request`, `pull-request-closed`, `pull-request-created`, `pull-request-opened`,
    # `pull-request-updated`, `push`, `release`, `release-created`, `release-deleted`, `release-edited`,
    # `release-prereleased`, `release-published`, `release-unpublished`
    #
    #
    events:

    # If specified, only run the workflow for branches matching one of these filters.
    branches:

    # If specified, only run the workflow for tags matching one of these filters.
    tags:

    # If specified, do not run the workflow for branches matching one of these filters.
    ignoreBranches:

    # If specified, do not run the workflow for tags matching one of these filters.
    ignoreTags:
```

## Configuration Keys


### `apiVersion`

The schema version of this workflow's config (currently not used).

| Type     | Allowed Values | Default          | Required |
| -------- | -------------- | ---------------- | -------- |
| `string` | "garden.io/v0" | `"garden.io/v0"` | Yes      |

### `kind`

| Type     | Allowed Values | Default      | Required |
| -------- | -------------- | ------------ | -------- |
| `string` | "Workflow"     | `"Workflow"` | Yes      |

### `name`

The name of this workflow.

| Type     | Required |
| -------- | -------- |
| `string` | Yes      |

Example:

```yaml
name: "my-workflow"
```

### `description`

A description of the workflow.

| Type     | Required |
| -------- | -------- |
| `string` | No       |

### `files[]`

A list of files to write before starting the workflow.

This is useful to e.g. create files required for provider authentication, and can be created from data stored in secrets or templated strings.

Note that you cannot reference provider configuration in template strings within this field, since they are resolved after these files are generated. This means you can reference the files specified here in your provider configurations.

| Type            | Required |
| --------------- | -------- |
| `array[object]` | No       |

### `files[].path`

[files](#files) > path

POSIX-style path to write the file to, relative to the project root (or absolute). If the path contains one
or more directories, they are created automatically if necessary.
If any of those directories conflict with existing file paths, or if the file path conflicts with an existing directory path, an error will be thrown.
**Any existing file with the same path will be overwritten, so be careful not to accidentally accidentally overwrite files unrelated to your workflow.**

| Type        | Required |
| ----------- | -------- |
| `posixPath` | No       |

Example:

```yaml
files:
  - path: ".auth/kubeconfig.yaml"
```

### `files[].data`

[files](#files) > data

The file data as a string.

| Type     | Required |
| -------- | -------- |
| `string` | No       |

### `files[].secretName`

[files](#files) > secretName

The name of a Garden secret to copy the file data from (Garden Enterprise only).

| Type     | Required |
| -------- | -------- |
| `string` | No       |

### `keepAliveHours`

The number of hours to keep the workflow pod running after completion.

| Type     | Default | Required |
| -------- | ------- | -------- |
| `number` | `48`    | No       |

### `limits`

| Type     | Default                      | Required |
| -------- | ---------------------------- | -------- |
| `object` | `{"cpu":1000,"memory":1024}` | No       |

### `limits.cpu`

[limits](#limits) > cpu

The maximum amount of CPU the workflow pod can use, in millicpus (i.e. 1000 = 1 CPU)

| Type     | Default | Required |
| -------- | ------- | -------- |
| `number` | `1000`  | No       |

### `limits.memory`

[limits](#limits) > memory

The maximum amount of RAM the workflow pod can use, in megabytes (i.e. 1024 = 1 GB)

| Type     | Default | Required |
| -------- | ------- | -------- |
| `number` | `1024`  | No       |

### `steps[]`

The steps the workflow should run. At least one step is required. Steps are run sequentially. If a step fails, subsequent steps are skipped.

| Type            | Required |
| --------------- | -------- |
| `array[object]` | Yes      |

### `steps[].name`

[steps](#steps) > name

An identifier to assign to this step. If none is specified, this defaults to "step-<number of step>", where
<number of step> is the sequential number of the step (first step being number 1).

This identifier is useful when referencing command outputs in following steps. For example, if you set this
to "my-step", following steps can reference the \${steps.my-step.outputs.*} key in the `script` or `command`
fields.

| Type     | Required |
| -------- | -------- |
| `string` | No       |

### `steps[].command[]`

[steps](#steps) > command

A Garden command this step should run, followed by any required or optional arguments and flags.
Arguments and options for the commands may be templated, including references to previous steps, but for now
the commands themselves (as listed below) must be hard-coded.

Supported commands:

`[build]`
`[delete, environment]`
`[delete, service]`
`[deploy]`
`[exec]`
`[get, config]`
`[get, outputs]`
`[get, status]`
`[get, task-result]`
`[get, test-result]`
`[link, module]`
`[link, source]`
`[publish]`
`[run, task]`
`[run, test]`
`[test]`
`[update-remote, all]`
`[update-remote, modules]`
`[update-remote, sources]`



| Type            | Required |
| --------------- | -------- |
| `array[string]` | No       |

Example:

```yaml
steps:
  - command:
      - run
      - task
      - my-task
```

### `steps[].description`

[steps](#steps) > description

A description of the workflow step.

| Type     | Required |
| -------- | -------- |
| `string` | No       |

### `steps[].script`

[steps](#steps) > script

A bash script to run. Note that the host running the workflow must have bash installed and on path.
It is considered to have run successfully if it returns an exit code of 0. Any other exit code signals an error,
and the remainder of the workflow is aborted.

The script may include template strings, including references to previous steps.

| Type     | Required |
| -------- | -------- |
| `string` | No       |

### `steps[].skip`

[steps](#steps) > skip

Set to true to skip this step. Use this with template conditionals to skip steps for certain environments or scenarios.

| Type      | Default | Required |
| --------- | ------- | -------- |
| `boolean` | `false` | No       |

Example:

```yaml
steps:
  - skip: "${environment.name != 'prod'}"
```

### `triggers[]`

A list of triggers that determine when the workflow should be run, and which environment should be used (Garden Enterprise only).

| Type            | Required |
| --------------- | -------- |
| `array[object]` | No       |

### `triggers[].environment`

[triggers](#triggers) > environment

The environment name (from your project configuration) to use for the workflow when matched by this trigger.

| Type     | Required |
| -------- | -------- |
| `string` | Yes      |

### `triggers[].namespace`

[triggers](#triggers) > namespace

The namespace to use for the workflow when matched by this trigger. Follows the namespacing setting used for this trigger's environment, as defined in your project's environment configs.

| Type     | Required |
| -------- | -------- |
| `string` | No       |

### `triggers[].events[]`

[triggers](#triggers) > events

A list of [GitHub events](https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads) that should trigger this workflow.

Supported events:

`create`, `pull-request`, `pull-request-closed`, `pull-request-created`, `pull-request-opened`, `pull-request-updated`, `push`, `release`, `release-created`, `release-deleted`, `release-edited`, `release-prereleased`, `release-published`, `release-unpublished`



| Type            | Required |
| --------------- | -------- |
| `array[string]` | No       |

### `triggers[].branches[]`

[triggers](#triggers) > branches

If specified, only run the workflow for branches matching one of these filters.

| Type            | Required |
| --------------- | -------- |
| `array[string]` | No       |

### `triggers[].tags[]`

[triggers](#triggers) > tags

If specified, only run the workflow for tags matching one of these filters.

| Type            | Required |
| --------------- | -------- |
| `array[string]` | No       |

### `triggers[].ignoreBranches[]`

[triggers](#triggers) > ignoreBranches

If specified, do not run the workflow for branches matching one of these filters.

| Type            | Required |
| --------------- | -------- |
| `array[string]` | No       |

### `triggers[].ignoreTags[]`

[triggers](#triggers) > ignoreTags

If specified, do not run the workflow for tags matching one of these filters.

| Type            | Required |
| --------------- | -------- |
| `array[string]` | No       |

