// Package config exposes the baseline configuration that ships compiled into
// the API binary. The embedded YAML provides local-development defaults;
// deployments replace any value through environment variables.
package config

import "embed"

//go:embed *.yaml
var Files embed.FS
