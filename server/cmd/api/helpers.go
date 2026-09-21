package main

import "strings"

func first(v, d string) string {
	if strings.TrimSpace(v) == "" {
		return d
	}
	return v
}

func slugify(v string) string {
	v = strings.ToLower(strings.TrimSpace(v))
	var b strings.Builder
	for _, r := range v {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
		} else if r == '-' || r == '_' || r == ' ' {
			b.WriteRune('-')
		}
	}
	s := strings.Trim(b.String(), "-")
	for strings.Contains(s, "--") {
		s = strings.ReplaceAll(s, "--", "-")
	}
	return s
}

func contains(xs []string, v string) bool {
	for _, x := range xs {
		if x == v {
			return true
		}
	}
	return false
}

func maxInt(v, d int) int {
	if v <= 0 {
		return d
	}
	return v
}