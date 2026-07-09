// Popula dados de demonstração via API do gateway.
// Uso:
//   API=http://localhost:3001/api node scripts/seed.mjs
//   API=https://acolhe-api-gateway.onrender.com/api node scripts/seed.mjs
//
// Cria: 1 admin, 2 pacientes, operadoras + planos e hospitais em SP
// (com geolocalização). Seguro rodar de novo — registros duplicados
// apenas falham silenciosamente (409/já existe).

const API = process.env.API || 'http://localhost:3001/api'
const PASSWORD = 'acolhe123'

async function req(method, path, body, token) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  if (!res.ok) return null
  return data
}

async function login(email) {
  const r = await req('POST', '/auth/login', { email, password: PASSWORD })
  return r?.token
}

console.log(`Seed → ${API}`)

// ── Usuários ──────────────────────────────────────────────────────────
await req('POST', '/auth/register', {
  name: 'Gabriel Amorim', email: 'admin@acolhe.app', password: PASSWORD,
  cpf: '39053344705', phone: '11987654321', role: 'SYSTEM_ADMIN', lgpdConsent: true,
})

await req('POST', '/auth/register', {
  name: 'Maria Souza', email: 'maria@exemplo.com', password: PASSWORD,
  cpf: '12345678909', phone: '11912345678', role: 'PATIENT', lgpdConsent: true,
  dateOfBirth: '1992-03-14T00:00:00.000Z', bloodType: 'O_POSITIVE',
  allergies: ['Dipirona'], chronicConditions: [],
  emergencyContactName: 'João Souza', emergencyContactPhone: '11955554444',
  emergencyContactRelationship: 'Cônjuge',
})

await req('POST', '/auth/register', {
  name: 'Carlos Pereira', email: 'carlos@exemplo.com', password: PASSWORD,
  cpf: '98765432100', phone: '11933332222', role: 'PATIENT', lgpdConsent: true,
  dateOfBirth: '1985-11-02T00:00:00.000Z', bloodType: 'A_NEGATIVE',
  allergies: [], chronicConditions: ['Hipertensão'],
  emergencyContactName: 'Ana Pereira', emergencyContactPhone: '11966667777',
  emergencyContactRelationship: 'Irmã',
})

const token = await login('admin@acolhe.app')
if (!token) { console.error('Falha no login admin — abortando.'); process.exit(1) }
console.log('Usuários ok (admin, maria, carlos — senha: acolhe123)')

// ── Operadoras + planos ───────────────────────────────────────────────
const insurances = [
  { name: 'Vida+ Saúde', cnpj: '11222333000144', phone: '1140004000', email: 'contato@vidamais.com.br',
    website: 'https://vidamais.example.com', street: 'Av. Faria Lima', number: '2000',
    neighborhood: 'Itaim Bibi', city: 'São Paulo', state: 'SP', zipCode: '01451000' },
  { name: 'Bem Estar Nacional', cnpj: '55666777000188', phone: '1150005000', email: 'contato@bemestar.com.br',
    website: 'https://bemestar.example.com', street: 'Av. Berrini', number: '1500',
    neighborhood: 'Brooklin', city: 'São Paulo', state: 'SP', zipCode: '04571010' },
]

const insuranceIds = {}
for (const ins of insurances) {
  const created = await req('POST', '/health-insurances', ins, token)
  if (created?.id) insuranceIds[ins.name] = created.id
}

const planDefaults = {
  coverageEmergencyRoom: true, coverageHospitalization: true, coverageSurgery: true,
  coverageExams: true, coverageTelemedicine: true, coverageSpecialties: [],
}
const plans = [
  { insurer: 'Vida+ Saúde', name: 'Vida+ Essencial', code: 'VM-ESS-01', coverageType: 'STANDARD', monthlyPrice: 289.9, coPaymentConsultation: 25, coPaymentExam: 15, coPaymentEmergency: 50 },
  { insurer: 'Vida+ Saúde', name: 'Vida+ Premium', code: 'VM-PRM-01', coverageType: 'PREMIUM', monthlyPrice: 589.9, coPaymentConsultation: 0, coPaymentExam: 0, coPaymentEmergency: 0 },
  { insurer: 'Bem Estar Nacional', name: 'BEN Completo', code: 'BEN-CPL-01', coverageType: 'FULL', monthlyPrice: 449.9, coPaymentConsultation: 10, coPaymentExam: 5, coPaymentEmergency: 20 },
]
for (const p of plans) {
  const { insurer, ...rest } = p
  const id = insuranceIds[insurer]
  if (id) await req('POST', `/health-insurances/${id}/plans`, { ...planDefaults, ...rest }, token)
}
console.log('Operadoras e planos ok')

// ── Hospitais (com geolocalização) ────────────────────────────────────
const acceptedAll = [...Object.values(insuranceIds), ...Object.keys(insuranceIds)]
const hospitals = [
  { name: 'Hospital Santa Clara', cnpj: '12345678000190', type: 'PRIVATE', street: 'Av. Paulista', number: '1000', neighborhood: 'Bela Vista', city: 'São Paulo', state: 'SP', zipCode: '01310100', latitude: -23.5629, longitude: -46.6544, phone: '1133334444', email: 'contato@santaclara.com.br', specialties: ['Clínica Geral', 'Cardiologia', 'Ortopedia', 'Pediatria'], totalBeds: 220, emergencyBeds: 40, icuBeds: 20, emergency24h: true, acceptedHealthInsurances: acceptedAll },
  { name: 'Hospital Jardins', cnpj: '98765432000110', type: 'PRIVATE', street: 'R. Oscar Freire', number: '250', neighborhood: 'Jardins', city: 'São Paulo', state: 'SP', zipCode: '01426000', latitude: -23.5662, longitude: -46.6698, phone: '1144445555', email: 'contato@hjardins.com.br', specialties: ['Clínica Geral', 'Dermatologia', 'Oftalmologia'], totalBeds: 120, emergencyBeds: 18, icuBeds: 8, emergency24h: true, acceptedHealthInsurances: acceptedAll },
  { name: 'Hospital Vila Mariana', cnpj: '45678912000133', type: 'MIXED', street: 'R. Domingos de Morais', number: '1800', neighborhood: 'Vila Mariana', city: 'São Paulo', state: 'SP', zipCode: '04010200', latitude: -23.5893, longitude: -46.6344, phone: '1155556666', email: 'contato@hvm.org.br', specialties: ['Clínica Geral', 'Pediatria', 'Ginecologia'], totalBeds: 160, emergencyBeds: 25, icuBeds: 12, emergency24h: false, acceptedHealthInsurances: acceptedAll },
  { name: 'Hospital Pinheiros', cnpj: '32165498000177', type: 'PRIVATE', street: 'R. dos Pinheiros', number: '700', neighborhood: 'Pinheiros', city: 'São Paulo', state: 'SP', zipCode: '05422001', latitude: -23.5646, longitude: -46.6911, phone: '1166667777', email: 'contato@hpinheiros.com.br', specialties: ['Clínica Geral', 'Ortopedia', 'Neurologia'], totalBeds: 140, emergencyBeds: 22, icuBeds: 10, emergency24h: true, acceptedHealthInsurances: acceptedAll },
  { name: 'Hospital Municipal de Moema', cnpj: '74185296000155', type: 'PUBLIC', street: 'Av. Ibirapuera', number: '3100', neighborhood: 'Moema', city: 'São Paulo', state: 'SP', zipCode: '04029200', latitude: -23.6072, longitude: -46.6668, phone: '1177778888', email: 'contato@hmmoema.sp.gov.br', specialties: ['Clínica Geral', 'Pediatria', 'Cardiologia'], totalBeds: 260, emergencyBeds: 50, icuBeds: 24, emergency24h: true, acceptedHealthInsurances: [] },
  { name: 'Clínica Tatuapé', cnpj: '85296374000122', type: 'PRIVATE', street: 'R. Tuiuti', number: '1200', neighborhood: 'Tatuapé', city: 'São Paulo', state: 'SP', zipCode: '03307000', latitude: -23.5407, longitude: -46.5763, phone: '1188889999', email: 'contato@clinicatatuape.com.br', specialties: ['Clínica Geral', 'Dermatologia', 'Ginecologia'], totalBeds: 60, emergencyBeds: 8, icuBeds: 4, emergency24h: false, acceptedHealthInsurances: acceptedAll },
]
let n = 0
for (const h of hospitals) {
  const created = await req('POST', '/hospitals', h, token)
  if (created?.id) n++
}
console.log(`Hospitais ok (${n}/${hospitals.length})`)
console.log('\nSeed concluído.')
