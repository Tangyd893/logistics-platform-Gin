package utils

import (
	"testing"
)

func TestGenerateAndParseToken(t *testing.T) {
	token, err := GenerateToken("admin", "ADMIN", 86400000)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}
	if token == "" {
		t.Fatal("token is empty")
	}

	claims, err := ParseToken(token)
	if err != nil {
		t.Fatalf("ParseToken failed: %v", err)
	}
	if claims.Username != "admin" {
		t.Errorf("username = %q, want %q", claims.Username, "admin")
	}
	if claims.RoleCode != "ADMIN" {
		t.Errorf("roleCode = %q, want %q", claims.RoleCode, "ADMIN")
	}
}

func TestParseToken_Invalid(t *testing.T) {
	_, err := ParseToken("invalid-token")
	if err == nil {
		t.Error("expected error for invalid token, got nil")
	}
}
