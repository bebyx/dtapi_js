pipeline {
    agent any
    environment {
        HOST = 'bebyx.ssh.if.ua'
        GCR = 'eu.gcr.io/trainingground-285720/fe'
    }

    stages {
        stage('Prepare') {
            steps {
                //Install modules
                sh '/usr/bin/npm install'

                //Set environment
                sh 'sed -i "s|https://dtapi.if.ua/api/|http://${HOST}/api/|" src/environments/environment.ts'
                sh 'sed -i "s|https://dtapi.if.ua/api/|http://${HOST}/api/|" src/environments/environment.ts'

            }
        }

        //stage('Test') {
        //    steps {
        //        sh '/usr/local/bin/ng test'
        //        sh '/usr/local/bin/ng e2e'
        //    }
        //}

        stage('Build') {
            steps {
                //Build artefacts
                sh '/usr/local/bin/ng build'
                sh 'cp ./building/htaccess_example_fe ./dist/IF105/.htaccess'
            }

        }

        stage('Deploy') {
            steps {
                //Build and push image, re-run k8s container
                sh '''
                docker images | grep fe-local && docker rmi fe-local
                docker build -t fe-local .
                docker tag fe-local ${GCR}
                docker push ${GCR}
                kubectl replace -f ./building/fe-deployment.yaml
                '''
            }

        }
    }
}
