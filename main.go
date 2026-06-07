package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
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

	// Core deployment endpoint mapping
	router.POST("/api/v1/deploy", handleDeploy)

	// Start the API server on port 8080
	fmt.Println("[INFO] Starting OpenCloud API Engine on port 8080...")
	if err := router.Run(":8080"); err != nil {
		fmt.Printf("[FATAL] Failed to start server: %v\n", err)
	}
}

// handleDeploy processes the deployment request and interfaces with the K3s cluster
func handleDeploy(c *gin.Context) {
	var req DeployRequest

	// Validate the incoming JSON payload against the DeployRequest struct
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid payload format",
			"details": err.Error(),
		})
		return
	}

	fmt.Printf("[INFO] Received deployment request: App=%s, Image=%s, Port=%d\n", req.AppName, req.Image, req.Port)

	if clientset == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kubernetes client not initialized"})
		return
	}

	deployClient := clientset.AppsV1().Deployments("default")
	serviceClient := clientset.CoreV1().Services("default")

	deployment := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name: req.AppName,
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: int32Ptr(1),
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app": req.AppName,
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"app": req.AppName,
					},
				},
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{
						{
							Name:  req.AppName,
							Image: req.Image,
							Ports: []corev1.ContainerPort{
								{
									ContainerPort: int32(req.Port),
								},
							},
						},
					},
				},
			},
		},
	}

	service := &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name: req.AppName + "-svc",
		},
		Spec: corev1.ServiceSpec{
			Selector: map[string]string{
				"app": req.AppName,
			},
			Ports: []corev1.ServicePort{
				{
					Protocol:   corev1.ProtocolTCP,
					Port:       80,
					TargetPort: intstr.FromInt(req.Port),
				},
			},
			Type: corev1.ServiceTypeClusterIP,
		},
	}

	_, err := deployClient.Create(context.TODO(), deployment, metav1.CreateOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create deployment", "details": err.Error()})
		return
	}

	_, err = serviceClient.Create(context.TODO(), service, metav1.CreateOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create service", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Successfully processed request for %s", req.AppName),
		"status":  "Kubernetes deployment initiated",
		"app":     req.AppName,
		"image":   req.Image,
		"port":    req.Port,
	})
}

func int32Ptr(i int32) *int32 { return &i }