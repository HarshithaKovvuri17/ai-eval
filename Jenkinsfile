pipeline {
    agent any

    environment {
        // Change these to your actual values
        DOCKER_REGISTRY_USER = 'charan6465' 
        PROJECT_NAME = 'ai-eval'
        BACKEND_IMAGE = "${DOCKER_REGISTRY_USER}/${PROJECT_NAME}-backend"
        FRONTEND_IMAGE = "${DOCKER_REGISTRY_USER}/${PROJECT_NAME}-frontend"
        EC2_USER = 'ubuntu'
        EC2_IP = '34.228.170.191' // Actual EC2 Public IP
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'
                    withSonarQubeEnv('SonarQubeServer') {
                        if (isUnix()) {
                            sh "${scannerHome}/bin/sonar-scanner"
                        } else {
                            bat "${scannerHome}\\bin\\sonar-scanner.bat"
                        }
                    }
                }
            }
        }

        stage('Docker Build & Push') {
            steps {
                script {
                    docker.withRegistry('', 'docker-hub-credentials') {
                        // Build and Push Backend
                        def backendApp = docker.build("${BACKEND_IMAGE}:${env.BUILD_NUMBER}", "./backend")
                        backendApp.push()
                        backendApp.push("latest")

                        // Build and Push Frontend
                        def frontendApp = docker.build("${FRONTEND_IMAGE}:${env.BUILD_NUMBER}", "./frontend")
                        frontendApp.push()
                        frontendApp.push("latest")
                    }
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                script {
                    withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY')]) {
                        if (isUnix()) {
                            // Ensure directory exists
                            sh "ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${env.EC2_USER}@${env.EC2_IP} 'mkdir -p /home/ubuntu/app'"
                            // Copy production compose file
                            sh "scp -o StrictHostKeyChecking=no -i ${SSH_KEY} docker-compose.prod.yml ${env.EC2_USER}@${env.EC2_IP}:/home/ubuntu/app/docker-compose.yml"
                            // Deploy
                            sh "ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${env.EC2_USER}@${env.EC2_IP} 'cd /home/ubuntu/app && docker compose pull && docker compose up -d && docker image prune -f'"
                        } else {
                            // Ensure directory exists
                            bat "ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${env.EC2_USER}@${env.EC2_IP} \"mkdir -p /home/ubuntu/app\""
                            // Copy production compose file
                            bat "scp -o StrictHostKeyChecking=no -i ${SSH_KEY} docker-compose.prod.yml ${env.EC2_USER}@${env.EC2_IP}:/home/ubuntu/app/docker-compose.yml"
                            // Deploy
                            bat "ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${env.EC2_USER}@${env.EC2_IP} \"cd /home/ubuntu/app && docker compose pull && docker compose up -d && docker image prune -f\""
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo "Successfully deployed version ${env.BUILD_NUMBER} to EC2!"
        }
        failure {
            echo "Pipeline failed. Check SonarQube or build logs."
        }
    }
}
