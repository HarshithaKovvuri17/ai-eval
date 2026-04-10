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
        stage('Verify .env File') {
            steps {
                script {
                    withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY')]) {
                        if (isUnix()) {
                            sh 'chmod 600 $SSH_KEY'
                            sh "ssh -o StrictHostKeyChecking=no -i \$SSH_KEY ${env.EC2_USER}@${env.EC2_IP} 'grep MONGODB_URI /home/ubuntu/app/.env || echo \"MISSING MONGODB_URI\"'"
                        } else {
                            powershell '''
                                $path = $env:SSH_KEY
                                $acl = Get-Acl $path
                                $acl.SetAccessRuleProtection($true, $false)
                                $currentPrincipal = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
                                $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule($currentPrincipal, "FullControl", "Allow")
                                $acl.SetAccessRule($accessRule)
                                Set-Acl $path $acl
                            '''
                            bat "ssh -o StrictHostKeyChecking=no -i %SSH_KEY% ${env.EC2_USER}@${env.EC2_IP} \"grep MONGODB_URI /home/ubuntu/app/.env || echo 'MISSING MONGODB_URI'\""
                        }
                    }
                }
            }
        }
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test & Coverage') {
            steps {
                script {
                    // Generate backend coverage
                    dir('backend') {
                        if (isUnix()) {
                            sh "npm install && npm run test:coverage"
                        } else {
                            bat "npm install && npm run test:coverage"
                        }
                    }
                    // Generate frontend coverage
                    dir('frontend') {
                        if (isUnix()) {
                            sh "npm install && npm run test:coverage"
                        } else {
                            bat "npm install && npm run test:coverage"
                        }
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'
                    withSonarQubeEnv('SonarQubeServer') {
                        if (isUnix()) {
                            sh "${scannerHome}/bin/sonar-scanner -Dsonar.token=\$SONAR_AUTH_TOKEN"
                        } else {
                            bat "${scannerHome}\\bin\\sonar-scanner.bat -Dsonar.token=%SONAR_AUTH_TOKEN%"
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
                            sh 'chmod 600 $SSH_KEY'
                            sh "ssh -o StrictHostKeyChecking=no -i \$SSH_KEY ${env.EC2_USER}@${env.EC2_IP} 'sudo mkdir -p /home/ubuntu/app/certificates && sudo chmod 777 /home/ubuntu/app/certificates'"
                            sh "scp -o StrictHostKeyChecking=no -i \$SSH_KEY docker-compose.prod.yml ${env.EC2_USER}@${env.EC2_IP}:/home/ubuntu/app/docker-compose.yml"
                            
                            withCredentials([string(credentialsId: 'backend-env', variable: 'ENV_CONTENT')]) {
                                def repairedEnv = env.ENV_CONTENT
                                if (!repairedEnv.contains('\n')) {
                                    repairedEnv = repairedEnv.replaceAll(/ (?=(?:#|PORT|FRONTEND|MONGODB|JWT|GOOGLE|EMAIL|AI)[A-Z0-9_]*=)/, "\n")
                                }
                                writeFile file: '.env', text: repairedEnv.trim()
                                sh "scp -o StrictHostKeyChecking=no -i \$SSH_KEY .env ${env.EC2_USER}@${env.EC2_IP}:/home/ubuntu/app/.env"
                            }

                            sh "ssh -o StrictHostKeyChecking=no -i \$SSH_KEY ${env.EC2_USER}@${env.EC2_IP} 'cd /home/ubuntu/app && docker-compose down && docker-compose pull && docker-compose up -d && docker image prune -f'"
                            
                            // Verify Certificates and Permissions
                            sh "ssh -o StrictHostKeyChecking=no -i \$SSH_KEY ${env.EC2_USER}@${env.EC2_IP} 'cd /home/ubuntu/app && echo \"Certificate Permissions:\" && ls -ld certificates && echo \"Generated Certificates:\" && ls -lh certificates || echo \"No certificates yet\"'"
                            
                            // Debug Logs
                            sh "ssh -o StrictHostKeyChecking=no -i \$SSH_KEY ${env.EC2_USER}@${env.EC2_IP} 'cd /home/ubuntu/app && docker-compose logs --tail=50 backend'"
                        } else {
                            powershell '''
                                $path = $env:SSH_KEY
                                $acl = Get-Acl $path
                                $acl.SetAccessRuleProtection($true, $false)
                                $currentPrincipal = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
                                $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule($currentPrincipal, "FullControl", "Allow")
                                $acl.SetAccessRule($accessRule)
                                Set-Acl $path $acl
                            '''
                            bat "ssh -o StrictHostKeyChecking=no -i %SSH_KEY% ${env.EC2_USER}@${env.EC2_IP} \"sudo mkdir -p /home/ubuntu/app/certificates && sudo chmod 777 /home/ubuntu/app/certificates\""
                            bat "scp -o StrictHostKeyChecking=no -i %SSH_KEY% docker-compose.prod.yml ${env.EC2_USER}@${env.EC2_IP}:/home/ubuntu/app/docker-compose.yml"
                            
                            withCredentials([string(credentialsId: 'backend-env', variable: 'ENV_CONTENT')]) {
                                def repairedEnv = env.ENV_CONTENT
                                if (!repairedEnv.contains('\n')) {
                                    repairedEnv = repairedEnv.replaceAll(/ (?=(?:#|PORT|FRONTEND|MONGODB|JWT|GOOGLE|EMAIL|AI)[A-Z0-9_]*=)/, "\n")
                                }
                                writeFile file: '.env', text: repairedEnv.trim()
                                bat "scp -o StrictHostKeyChecking=no -i %SSH_KEY% .env ${env.EC2_USER}@${env.EC2_IP}:/home/ubuntu/app/.env"
                            }

                            bat "ssh -o StrictHostKeyChecking=no -i %SSH_KEY% ${env.EC2_USER}@${env.EC2_IP} \"cd /home/ubuntu/app && docker-compose down && docker-compose pull && docker-compose up -d && docker image prune -f\""
                            
                            // Verify Certificates and Permissions
                            bat "ssh -o StrictHostKeyChecking=no -i %SSH_KEY% ${env.EC2_USER}@${env.EC2_IP} \"cd /home/ubuntu/app && echo 'Certificate Permissions:' && ls -ld certificates && echo 'Generated Certificates:' && ls -lh certificates\""
                            
                            // Debug Logs
                            bat "ssh -o StrictHostKeyChecking=no -i %SSH_KEY% ${env.EC2_USER}@${env.EC2_IP} \"cd /home/ubuntu/app && docker-compose logs --tail=50 backend\""
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
