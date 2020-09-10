pipeline {
    agent any

    stages {
        stage('Prepare') {
            steps {
                //Install modules
                sh '/usr/bin/npm install'

                //Set environment
                sh 'sed -i "s|https://dtapi.if.ua/api/|http://bebyx.ssh.if.ua/api/|" src/environments/environment.ts'
                sh 'sed -i "s|https://dtapi.if.ua/api/|http://bebyx.ssh.if.ua/api/|" src/environments/environment.ts'

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
                docker tag fe-local eu.gcr.io/trainingground-285720/fe
                docker push eu.gcr.io/trainingground-285720/fe
                kubectl replace -f ./building/fe-deployment.yaml
                '''
            }

        }
    }
}
