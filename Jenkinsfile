pipeline {
  agent any

  options {
    timestamps()
    ansiColor('xterm')
    disableConcurrentBuilds()
  }

  environment {
    TEST_ENV = 'test'
    CI = 'true'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install And Test (Docker)') {
      steps {
        script {
          docker.image('mcr.microsoft.com/playwright:v1.46.0-jammy').inside('--ipc=host') {
            sh 'node --version'
            sh 'npm --version'
            sh 'npm ci'
            sh 'npm run lint'
            sh 'npm run test:test'
          }
        }
      }
      post {
        always {
          archiveArtifacts artifacts: 'playwright-report/**, test-results/**, allure-results/**', allowEmptyArchive: true
        }
      }
    }

    stage('Generate Allure Html (Docker)') {
      steps {
        script {
          docker.image('mcr.microsoft.com/playwright:v1.46.0-jammy').inside('--ipc=host') {
            sh 'npm ci'
            sh 'npm run allure:gen'
          }
        }
      }
      post {
        always {
          archiveArtifacts artifacts: 'allure-report/**', allowEmptyArchive: true
        }
      }
    }
  }
}
