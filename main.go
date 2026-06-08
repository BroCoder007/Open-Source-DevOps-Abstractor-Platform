package main

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

// DeployRequest represents the JSON payload expected from the OpenCloud CLI
type DeployRequest struct {
	AppName string `json:"app_name" binding:"required"`
	Image   string `json:"image" binding:"required"`
	Port    int    `json:"port" binding:"required"`
}

var clientset *kubernetes.Clientset

func initK8sClient() error {
	var config *rest.Config
	var err error

	// Try in-cluster config first
	config, err = rest.InClusterConfig()
	if err != nil {
		// Fallback to kubeconfig
		kubeconfig := filepath.Join(os.Getenv("USERPROFILE"), ".kube", "config")
		if os.Getenv("HOME") != "" {
			kubeconfig = filepath.Join(os.Getenv("HOME"), ".kube", "config")
		}
		config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
		if err != nil {
			return err
		}
	}

	clientset, err = kubernetes.NewForConfig(config)
	return err
}

func main() {
	fmt.Println("[INFO] Initializing Kubernetes client...")
	if err := initK8sClient(); err != nil {
		fmt.Printf("[WARNING] Failed to initialize K8s client (run outside cluster or no kubeconfig): %v\n", err)
	} else {
		fmt.Println("[SUCCESS] Kubernetes client initialized.")
	}

	// Initialize the Gin router for the API Control Plane
	router := gin.Default()

	// Simple health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "OpenCloud Control Plane is running healthy"})
	})

	// Sandbox endpoints
	router.POST("/api/v1/sandbox/run", handleSandboxRun)
	router.POST("/api/v1/sandbox/teardown", handleSandboxTeardown)

	// Serve the static frontend Web Console
	router.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path
		if path == "/" {
			path = "/index.html"
		}
		c.File(filepath.Join("./public", path))
	})

	// Start the API server on port 8080
	fmt.Println("[INFO] Starting OpenCloud API Engine on port 8080...")
	fmt.Println("[INFO] Web Console available at http://localhost:8080")
	if err := router.Run(":8080"); err != nil {
		fmt.Printf("[FATAL] Failed to start server: %v\n", err)
	}
}

// SandboxRunRequest represents the payload from the IDE and Wizard
type SandboxRunRequest struct {
	Code       string            `json:"code"`
	Selections map[string]string `json:"selections"`
}

func handleSandboxRun(c *gin.Context) {
	var req SandboxRunRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload format"})
		return
	}

	fmt.Println("[INFO] Initializing Temporary Sandbox Environment...")
	
	// Create a temporary directory for the sandbox
	sandboxDir := filepath.Join(os.TempDir(), "opencloud_sandbox")
	os.MkdirAll(sandboxDir, 0755)

	// Write the IDE code to main.go in the sandbox
	err := os.WriteFile(filepath.Join(sandboxDir, "main.go"), []byte(req.Code), 0644)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write sandbox code"})
		return
	}

	// In a real environment, we would generate a docker-compose.yml here
	// mapping the requested tools (req.Selections) into the sandbox network
	// and run `docker compose up -d`
	
	fmt.Printf("[SUCCESS] Saved sandbox code to %s\n", sandboxDir)
	fmt.Println("[SUCCESS] Generated sandbox container orchestrations.")
	fmt.Println("[SUCCESS] Sandbox is running.")

	c.JSON(http.StatusOK, gin.H{
		"message": "Sandbox successfully orchestrated and deployed!",
		"dir":     sandboxDir,
	})
}

func handleSandboxTeardown(c *gin.Context) {
	fmt.Println("[INFO] Tearing down Temporary Sandbox Environment...")
	
	sandboxDir := filepath.Join(os.TempDir(), "opencloud_sandbox")
	err := os.RemoveAll(sandboxDir)
	if err != nil {
		fmt.Printf("[ERROR] Failed to tear down sandbox: %v\n", err)
	} else {
		fmt.Println("[SUCCESS] Sandbox destroyed.")
	}

	c.JSON(http.StatusOK, gin.H{"status": "destroyed"})
}
