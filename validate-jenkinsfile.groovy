// Jenkinsfile Validation Script
// This script validates the Jenkinsfile syntax and structure

def validateJenkinsfile() {
    println "🔍 Validating Jenkinsfile..."
    
    try {
        // Check if Jenkinsfile exists
        def jenkinsfile = new File('Jenkinsfile')
        if (!jenkinsfile.exists()) {
            println "❌ Jenkinsfile not found"
            return false
        }
        
        // Read and parse Jenkinsfile
        def content = jenkinsfile.text
        
        // Check for required stages
        def requiredStages = ['Checkout', 'Setup Environment', 'Code Quality', 'Testing', 'Build', 'Deploy to Staging', 'Deploy to Production']
        
        requiredStages.each { stage ->
            if (!content.contains("stage('${stage}'")) {
                println "❌ Missing required stage: ${stage}"
                return false
            } else {
                println "✅ Found stage: ${stage}"
            }
        }
        
        // Check for environment variables
        def requiredEnvVars = ['NODE_VERSION', 'FRONTEND_DIR', 'BACKEND_DIR']
        
        requiredEnvVars.each { envVar ->
            if (!content.contains(envVar)) {
                println "❌ Missing environment variable: ${envVar}"
                return false
            } else {
                println "✅ Found environment variable: ${envVar}"
            }
        }
        
        // Check for deployment scripts
        def deploymentScripts = ['deploy-staging.sh', 'deploy-production.sh', 'deploy-staging.bat', 'deploy-production.bat']
        
        deploymentScripts.each { script ->
            def scriptFile = new File(script.startsWith('deploy-staging') ? 'scripts/' + script : 'scripts/' + script)
            if (scriptFile.exists()) {
                println "✅ Found deployment script: ${script}"
            }
        }
        
        // Check for Docker files
        def dockerFiles = ['client/Dockerfile', 'server/Dockerfile', 'docker-compose.yml']
        
        dockerFiles.each { dockerFile ->
            def file = new File(dockerFile)
            if (file.exists()) {
                println "✅ Found Docker file: ${dockerFile}"
            } else {
                println "❌ Missing Docker file: ${dockerFile}"
            }
        }
        
        println "✅ Jenkinsfile validation completed"
        return true
        
    } catch (Exception e) {
        println "❌ Error validating Jenkinsfile: ${e.message}"
        return false
    }
}

// Run validation
def result = validateJenkinsfile()
println "\n🎯 Validation Result: ${result ? 'SUCCESS' : 'FAILED'}"

if (result) {
    println "\n📋 Ready for Jenkins deployment!"
    println "🚀 Next steps:"
    println "1. Install Docker Desktop for Windows"
    println "2. Run setup-jenkins-windows.bat"
    println "3. Configure Jenkins with GitHub integration"
    println "4. Create pipeline job using Jenkinsfile"
} else {
    println "\n🔧 Please fix the issues above before proceeding"
}
