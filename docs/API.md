# API Documentation

## Base URL

```
http://localhost:3001/api
```

## Authentication

A maioria dos endpoints requer autenticação via JWT Bearer token.

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

## Endpoints

### Authentication

#### POST /auth/login
Autenticar usuário

**Request Body:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@email.com",
    "name": "Nome do Usuário",
    "role": "PATIENT",
    "status": "ACTIVE"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST /auth/register
Registrar novo usuário

**Request Body:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123",
  "name": "Nome do Usuário",
  "cpf": "12345678901",
  "phone": "11987654321",
  "role": "PATIENT"
}
```

#### POST /auth/refresh
Renovar token de acesso

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Users

#### GET /users
Listar usuários (requer admin)

**Query Parameters:**
- `page` (opcional): número da página (default: 1)
- `limit` (opcional): itens por página (default: 10)
- `search` (opcional): buscar por nome, email ou CPF

#### GET /users/me
Obter perfil do usuário autenticado

#### GET /users/:id
Obter usuário por ID

#### PUT /users/:id
Atualizar usuário

**Request Body:**
```json
{
  "name": "Novo Nome",
  "phone": "11999999999",
  "status": "ACTIVE"
}
```

#### DELETE /users/:id
Deletar usuário (requer SYSTEM_ADMIN)

---

### Patients

#### GET /patients
Listar pacientes

**Query Parameters:**
- `page` (opcional): número da página
- `limit` (opcional): itens por página
- `search` (opcional): buscar por nome, CPF ou email

#### GET /patients/:id
Obter paciente por ID

#### POST /patients
Criar novo paciente

**Request Body:**
```json
{
  "userId": "uuid",
  "dateOfBirth": "1990-01-01",
  "bloodType": "A_POSITIVE",
  "allergies": ["Penicilina"],
  "chronicConditions": ["Diabetes"],
  "emergencyContactName": "Nome Contato",
  "emergencyContactPhone": "11987654321",
  "emergencyContactRelationship": "Cônjuge",
  "healthInsuranceId": "uuid",
  "healthInsuranceNumber": "123456789"
}
```

#### PUT /patients/:id
Atualizar paciente

#### DELETE /patients/:id
Deletar paciente (requer SYSTEM_ADMIN)

---

### Hospitals

#### GET /hospitals
Listar hospitais (público)

**Query Parameters:**
- `page` (opcional): número da página
- `limit` (opcional): itens por página
- `search` (opcional): buscar por nome ou CNPJ
- `type` (opcional): PUBLIC, PRIVATE, MIXED
- `status` (opcional): ACTIVE, INACTIVE, MAINTENANCE

#### GET /hospitals/:id
Obter hospital por ID

#### POST /hospitals
Criar novo hospital (requer HOSPITAL_ADMIN ou SYSTEM_ADMIN)

**Request Body:**
```json
{
  "name": "Hospital São Lucas",
  "cnpj": "12345678000190",
  "type": "PRIVATE",
  "street": "Rua Principal",
  "number": "100",
  "neighborhood": "Centro",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01000000",
  "phone": "1133334444",
  "email": "contato@hospital.com",
  "specialties": ["Cardiologia", "Ortopedia"],
  "totalBeds": 200,
  "emergencyBeds": 30,
  "icuBeds": 20,
  "acceptedHealthInsurances": ["uuid1", "uuid2"],
  "emergency24h": true,
  "operatingHours": {
    "monday": { "open": "08:00", "close": "18:00" }
  }
}
```

#### PUT /hospitals/:id
Atualizar hospital

#### DELETE /hospitals/:id
Deletar hospital (requer SYSTEM_ADMIN)

---

### Queues

#### GET /queues
Listar entradas de fila

**Query Parameters:**
- `page` (opcional): número da página
- `limit` (opcional): itens por página
- `hospitalId` (opcional): filtrar por hospital
- `status` (opcional): WAITING, IN_PROGRESS, COMPLETED, CANCELLED
- `priority` (opcional): EMERGENCY, URGENT, SEMI_URGENT, NORMAL, LOW

#### GET /queues/:id
Obter entrada de fila por ID

#### GET /queues/hospital/:hospitalId
Obter filas de um hospital específico

**Query Parameters:**
- `status` (opcional): filtrar por status

#### GET /queues/hospital/:hospitalId/stats
Obter estatísticas de filas de um hospital

**Response:**
```json
{
  "hospitalId": "uuid",
  "totalWaiting": 12,
  "averageWaitTime": 45,
  "byPriority": {
    "EMERGENCY": 2,
    "URGENT": 3,
    "NORMAL": 7
  },
  "bySpecialty": {
    "Cardiologia": 5,
    "Ortopedia": 7
  },
  "timestamp": "2024-01-20T10:00:00Z"
}
```

#### POST /queues
Adicionar paciente à fila

**Request Body:**
```json
{
  "hospitalId": "uuid",
  "patientId": "uuid",
  "priority": "URGENT",
  "specialty": "Cardiologia",
  "symptoms": "Dor no peito"
}
```

#### PUT /queues/:id
Atualizar entrada de fila

**Request Body:**
```json
{
  "status": "IN_PROGRESS",
  "doctorId": "uuid",
  "roomNumber": "101",
  "notes": "Observações"
}
```

#### DELETE /queues/:id
Remover da fila

---

## WebSocket Events (Queue Service)

### Connection
```javascript
const socket = io('http://localhost:3002')
```

### Events to Emit

#### join:hospital
Entrar na sala de um hospital para receber atualizações
```javascript
socket.emit('join:hospital', 'hospital-uuid')
```

#### join:patient
Entrar na sala de um paciente para receber atualizações
```javascript
socket.emit('join:patient', 'patient-uuid')
```

#### queue:call-next
Chamar próximo paciente
```javascript
socket.emit('queue:call-next', {
  hospitalId: 'hospital-uuid',
  specialty: 'Cardiologia' // opcional
})
```

### Events to Listen

#### queue:update
Atualização na fila do hospital
```javascript
socket.on('queue:update', (data) => {
  console.log(data.action) // 'added', 'updated', 'removed'
  console.log(data.entry) // dados da entrada
})
```

#### queue:position
Atualização de posição do paciente
```javascript
socket.on('queue:position', (data) => {
  console.log(data.position) // nova posição
  console.log(data.estimatedWaitTime) // tempo estimado
})
```

#### queue:called
Paciente foi chamado
```javascript
socket.on('queue:called', (data) => {
  console.log(data.entry) // dados da entrada
  console.log(data.message) // mensagem
})
```

#### queue:status
Status da entrada mudou
```javascript
socket.on('queue:status', (data) => {
  console.log(data.status) // novo status
  console.log(data.position) // posição
})
```

---

## Status Codes

- `200` - OK
- `201` - Created
- `204` - No Content
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Internal Server Error

## Error Response Format

```json
{
  "status": "error",
  "message": "Mensagem de erro",
  "errors": [] // array de erros de validação (opcional)
}
```
