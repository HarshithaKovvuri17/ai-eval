pipeline {
    agent any

    environment {
        // Change these to your actual values
        DOCKER_REGISTRY_USER = 'charankurupudi' 
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
                        sh "${scannerHome}/bin/sonar-scanner"
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
                    def remote = [:]
                    remote.name = 'EC2-Production'
                    remote.host = env.EC2_IP
                    remote.user = env.EC2_USER
                    remote.allowAnyHosts = true

                    withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY')]) {
                        remote.identity = SSH_KEY
                        
                        // Commands to run on EC2
                        sshCommand remote: remote, command: """
                            cd /home/ubuntu/app || mkdir -p /home/ubuntu/app && cd /home/ubuntu/app
                            # Copy docker-compose.yml from the job (simplest way for this setup)
                            # In a real setup, you might scp it or pull the repo on EC2
                        """
                        
                        // Alternative scp of docker-compose
                        sshPut remote: remote, from: 'docker-compose.prod.yml', into: '/home/ubuntu/app/docker-compose.yml'
                        
                        sshCommand remote: remote, command: """
                            cd /home/ubuntu/app
                            docker compose pull
                            docker compose up -d
                            docker image prune -f
                        """
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
