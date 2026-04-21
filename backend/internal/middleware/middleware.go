package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"logistics-platform-gin/pkg/response"
	"logistics-platform-gin/pkg/utils"
)

func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Unauthorized(c, "未提供认证令牌")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			response.Unauthorized(c, "令牌格式错误，请使用 Bearer {token}")
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims, err := utils.ParseToken(tokenString)
		if err != nil {
			response.Unauthorized(c, "令牌无效或已过期")
			c.Abort()
			return
		}

		c.Set("username", claims.Username)
		c.Set("roleCode", claims.RoleCode)
		c.Next()
	}
}

func RoleCheck(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleCode, exists := c.Get("roleCode")
		if !exists {
			response.Forbidden(c, "无权限访问")
			c.Abort()
			return
		}

		for _, role := range allowedRoles {
			if role == roleCode {
				c.Next()
				return
			}
		}
		response.Forbidden(c, "无权限访问")
		c.Abort()
	}
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, Refresh-Token")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
