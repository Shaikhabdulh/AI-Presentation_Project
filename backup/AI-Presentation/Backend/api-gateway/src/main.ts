import { NestFactory } from '@nestjs/core'
import { ApiGatewayModule } from './api-gateway.module'

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule)
  
  app.enableCors()
  
  // Setup routes to microservices
  const httpAdapter = app.get('HttpAdapter')
  
  // Route to services
  app.use('/api/auth', (req, res, next) => {
    // Proxy to auth service
  })
  
  await app.listen(3000)
  console.log('API Gateway running on port 3000')
}

bootstrap()