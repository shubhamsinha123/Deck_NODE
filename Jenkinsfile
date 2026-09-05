pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                script {
                    // Log Node & NPM versions
                    bat 'node --version'
                    bat 'npm --version'
                }
                // Install dependencies
                bat 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                // Run Jest unit tests
                bat 'npm test'
            }
        }

        stage('Prettier Tests') {
            steps {
                bat 'npm run format'
            }
        }

        stage('Lint the project') {
            steps {
                // Run ESLint via standard npm script using .eslintrc.js
                bat 'npm run lint'
            }
        }
    }

    post {
        always {
            // Clean up workspace
            cleanWs()
        }
        success {
            // Send Slack notification on success
            slackSend(
                channel: '#jenkins-deck-digital',
                color: '#00FF00',
                message: "Build, Test and Lint succeeded for ${env.JOB_NAME} - ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Closed>)"
            )
        }
        unsuccessful {
            // Send Slack notification on failure
            slackSend(
                channel: '#jenkins-deck-digital',
                color: '#FF0000',
                message: "Build, Test and Lint failed for ${env.JOB_NAME} - ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Open>)"
            )
        }
    }
}
