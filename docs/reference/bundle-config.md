---
order: 42
title: Bundle Configuration
---

# Bundle Configuration Reference

Below is the schema reference for `Bundle` configuration files. To learn more about bundles and bundle templates, see the [Bundles guide](../using-garden/bundles.md).

The reference is divided into two sections:
* [YAML Schema](#yaml-schema) contains the config YAML schema
* [Configuration keys](#configuration-keys) describes each individual schema key for the configuration files.

Also check out the [BundleTemplate reference](./bundle-template-config.md).

## YAML Schema

The values in the schema below are the default values.

```yaml
# The schema version of this config (currently not used).
apiVersion: garden.io/v0

kind: Bundle

# The name of the bundle.
name:

# The BundleTemplate to use to generate this Bundle
template:

# A map of inputs to pass to the BundleTemplate. These must match the inputs schema of the BundleTemplate.
inputs:
```

## Configuration Keys


### `apiVersion`

The schema version of this config (currently not used).

| Type     | Allowed Values | Default          | Required |
| -------- | -------------- | ---------------- | -------- |
| `string` | "garden.io/v0" | `"garden.io/v0"` | Yes      |

### `kind`

| Type     | Allowed Values | Default    | Required |
| -------- | -------------- | ---------- | -------- |
| `string` | "Bundle"       | `"Bundle"` | Yes      |

### `name`

The name of the bundle.

| Type     | Required |
| -------- | -------- |
| `string` | Yes      |

### `template`

The BundleTemplate to use to generate this Bundle

| Type     | Required |
| -------- | -------- |
| `string` | Yes      |

### `inputs`

A map of inputs to pass to the BundleTemplate. These must match the inputs schema of the BundleTemplate.

| Type     | Required |
| -------- | -------- |
| `object` | No       |

