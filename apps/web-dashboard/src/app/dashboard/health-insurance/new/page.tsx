'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, Shield } from 'lucide-react'
import { api } from '@/lib/api'
import { RoleGuard } from '@/components/auth/RoleGuard'

// Dados das operadoras com informações de contato
interface OperadoraData {
  cnpj: string
  phone: string
  email: string
  website: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}

const operadorasData: Record<string, OperadoraData> = {
  'Hapvida NotreDame Intermédica': {
    cnpj: '63554067000198',
    phone: '08007772746',
    email: 'relacionamento@hapvida.com.br',
    website: 'https://www.hapvida.com.br',
    street: 'Avenida Heráclito Graça',
    number: '406',
    complement: '',
    neighborhood: 'Centro',
    city: 'Fortaleza',
    state: 'CE',
    zipCode: '60140061',
  },
  'Bradesco Saúde': {
    cnpj: '92693118000160',
    phone: '08007012007',
    email: 'atendimento@bradescosaude.com.br',
    website: 'https://www.bradescosaude.com.br',
    street: 'Rua Barão de Itapagipe',
    number: '225',
    complement: '',
    neighborhood: 'Rio Comprido',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zipCode: '20261005',
  },
  'SulAmérica Saúde': {
    cnpj: '01685053000156',
    phone: '08007252025',
    email: 'faleconosco@sulamerica.com.br',
    website: 'https://www.sulamerica.com.br',
    street: 'Rua Beatriz Larragoiti Lucas',
    number: '121',
    complement: '',
    neighborhood: 'Cidade Nova',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zipCode: '20211903',
  },
  'Amil': {
    cnpj: '29309127000179',
    phone: '08007250855',
    email: 'relacionamento@amil.com.br',
    website: 'https://www.amil.com.br',
    street: 'Avenida Juiz Marco Túlio Isaac',
    number: '3600',
    complement: '',
    neighborhood: 'Vila da Serra',
    city: 'Nova Lima',
    state: 'MG',
    zipCode: '34006073',
  },
  'Unimed Nacional': {
    cnpj: '03009324000139',
    phone: '08009400210',
    email: 'relacionamento@unimedcentral.com.br',
    website: 'https://www.centralnacionalunimed.com.br',
    street: 'Alameda Santos',
    number: '1827',
    complement: '15º andar',
    neighborhood: 'Cerqueira César',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01419002',
  },
  'Seguros Unimed': {
    cnpj: '04487255000157',
    phone: '08009401345',
    email: 'atendimento@segurosunimed.com.br',
    website: 'https://www.segurosunimed.com.br',
    street: 'Alameda Ministro Rocha Azevedo',
    number: '346',
    complement: '',
    neighborhood: 'Cerqueira César',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01410001',
  },
  'Porto Seguro Saúde': {
    cnpj: '61198164000160',
    phone: '08007272477',
    email: 'saude@portoseguro.com.br',
    website: 'https://www.portoseguro.com.br/saude',
    street: 'Alameda Ribeiro da Silva',
    number: '275',
    complement: '',
    neighborhood: 'Campos Elíseos',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01217010',
  },
  'Prevent Senior': {
    cnpj: '67550113000193',
    phone: '08007752060',
    email: 'atendimento@preventsenior.com.br',
    website: 'https://www.preventsenior.com.br',
    street: 'Rua Estela Borges Morato',
    number: '336',
    complement: '',
    neighborhood: 'Vila Andrade',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '05724100',
  },
  'Care Plus': {
    cnpj: '60702199000106',
    phone: '08007702301',
    email: 'careplus@careplus.com.br',
    website: 'https://www.careplus.com.br',
    street: 'Avenida Magalhães de Castro',
    number: '4800',
    complement: 'Torre 3',
    neighborhood: 'Cidade Jardim',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '05676120',
  },
  'Unimed Belo Horizonte': {
    cnpj: '16513178000176',
    phone: '08007221020',
    email: 'relacionamento@unimedbh.com.br',
    website: 'https://www.unimedbh.com.br',
    street: 'Avenida do Contorno',
    number: '4747',
    complement: '',
    neighborhood: 'Serra',
    city: 'Belo Horizonte',
    state: 'MG',
    zipCode: '30110090',
  },
  'Unimed Rio': {
    cnpj: '42163881000101',
    phone: '08007225400',
    email: 'relacionamento@unimedrio.com.br',
    website: 'https://www.unimedrio.com.br',
    street: 'Avenida Almirante Barroso',
    number: '52',
    complement: '24º andar',
    neighborhood: 'Centro',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zipCode: '20031918',
  },
  'Unimed São Paulo': {
    cnpj: '43202472000130',
    phone: '08000110005',
    email: 'atendimento@unimedsp.com.br',
    website: 'https://www.unimedsp.com.br',
    street: 'Rua Vergueiro',
    number: '1855',
    complement: '',
    neighborhood: 'Vila Mariana',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '04101000',
  },
  'Unimed Campinas': {
    cnpj: '46068425000133',
    phone: '08007722004',
    email: 'sac@unimedcampinas.com.br',
    website: 'https://www.unimedcampinas.com.br',
    street: 'Avenida das Amoreiras',
    number: '703',
    complement: '',
    neighborhood: 'Parque Itália',
    city: 'Campinas',
    state: 'SP',
    zipCode: '13036225',
  },
  'Unimed Curitiba': {
    cnpj: '75055772000120',
    phone: '08006415002',
    email: 'atendimento@unimedcuritiba.com.br',
    website: 'https://www.unimedcuritiba.com.br',
    street: 'Rua Sete de Setembro',
    number: '5388',
    complement: '',
    neighborhood: 'Batel',
    city: 'Curitiba',
    state: 'PR',
    zipCode: '80240000',
  },
  'Unimed Porto Alegre': {
    cnpj: '92960982000177',
    phone: '08005190500',
    email: 'atendimento@unimedpoa.com.br',
    website: 'https://www.unimedpoa.com.br',
    street: 'Avenida Carlos Gomes',
    number: '111',
    complement: '',
    neighborhood: 'Auxiliadora',
    city: 'Porto Alegre',
    state: 'RS',
    zipCode: '90480003',
  },
  'Unimed Fortaleza': {
    cnpj: '05868278000107',
    phone: '08007222525',
    email: 'faleconosco@unimedfortaleza.com.br',
    website: 'https://www.unimedfortaleza.com.br',
    street: 'Rua Ivan Lopes',
    number: '160',
    complement: '',
    neighborhood: 'Luciano Cavalcante',
    city: 'Fortaleza',
    state: 'CE',
    zipCode: '60810750',
  },
  'Unimed Recife': {
    cnpj: '09351423000154',
    phone: '08002811001',
    email: 'atendimento@unimedrecife.com.br',
    website: 'https://www.unimedrecife.com.br',
    street: 'Avenida Governador Agamenon Magalhães',
    number: '4775',
    complement: '',
    neighborhood: 'Ilha do Leite',
    city: 'Recife',
    state: 'PE',
    zipCode: '50070160',
  },
  'Unimed Salvador': {
    cnpj: '13561403000180',
    phone: '08002845200',
    email: 'atendimento@unimedsalvador.com.br',
    website: 'https://www.unimedsalvador.com.br',
    street: 'Avenida Antônio Carlos Magalhães',
    number: '3453',
    complement: '',
    neighborhood: 'Pituba',
    city: 'Salvador',
    state: 'BA',
    zipCode: '41820000',
  },
  'Unimed Vitória': {
    cnpj: '27360826000120',
    phone: '08007234545',
    email: 'relacionamento@unimedvitoria.com.br',
    website: 'https://www.unimedvitoria.com.br',
    street: 'Rua da Grécia',
    number: '13',
    complement: '',
    neighborhood: 'Praia da Costa',
    city: 'Vila Velha',
    state: 'ES',
    zipCode: '29101350',
  },
  'Unimed Goiânia': {
    cnpj: '01561592000171',
    phone: '08006461616',
    email: 'atendimento@unimedgoiania.coop.br',
    website: 'https://www.unimedgoiania.coop.br',
    street: 'Avenida T-63',
    number: '1655',
    complement: '',
    neighborhood: 'Setor Bueno',
    city: 'Goiânia',
    state: 'GO',
    zipCode: '74230100',
  },
  'Unimed Brasília': {
    cnpj: '26515577000108',
    phone: '08006442077',
    email: 'faleconosco@unimedbrasilia.com.br',
    website: 'https://www.unimedbrasilia.com.br',
    street: 'SGAS 902',
    number: 'Lote 12',
    complement: 'Bloco A',
    neighborhood: 'Asa Sul',
    city: 'Brasília',
    state: 'DF',
    zipCode: '70390020',
  },
  'Golden Cross': {
    cnpj: '33247800000110',
    phone: '08007246565',
    email: 'atendimento@goldencross.com.br',
    website: 'https://www.goldencross.com.br',
    street: 'Avenida das Américas',
    number: '8585',
    complement: 'Bloco 1',
    neighborhood: 'Barra da Tijuca',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zipCode: '22793081',
  },
  'Greenline Saúde': {
    cnpj: '58299777000197',
    phone: '08007752012',
    email: 'atendimento@greenline.com.br',
    website: 'https://www.greenline.com.br',
    street: 'Avenida Cidade Jardim',
    number: '900',
    complement: '9º andar',
    neighborhood: 'Itaim Bibi',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01454001',
  },
  'Assim Saúde': {
    cnpj: '27556098000150',
    phone: '08007072002',
    email: 'relacionamento@assim.com.br',
    website: 'https://www.assim.com.br',
    street: 'Rua da Passagem',
    number: '179',
    complement: '',
    neighborhood: 'Botafogo',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zipCode: '22290030',
  },
  'Cassi': {
    cnpj: '33719485000127',
    phone: '08007292030',
    email: 'faleconosco@cassi.com.br',
    website: 'https://www.cassi.com.br',
    street: 'SCS Quadra 4 Bloco A',
    number: '47',
    complement: 'Ed. Fundação Banco do Brasil',
    neighborhood: 'Asa Sul',
    city: 'Brasília',
    state: 'DF',
    zipCode: '70304914',
  },
  'Geap Saúde': {
    cnpj: '03658432000149',
    phone: '08007019000',
    email: 'sac@geap.com.br',
    website: 'https://www.geap.org.br',
    street: 'SAS Quadra 1 Bloco N',
    number: '2',
    complement: '',
    neighborhood: 'Asa Sul',
    city: 'Brasília',
    state: 'DF',
    zipCode: '70070010',
  },
  'Fundação Saúde Itaú': {
    cnpj: '61532634000155',
    phone: '08007290505',
    email: 'atendimento@fundacaosaude.com.br',
    website: 'https://www.fundacaosaude.org.br',
    street: 'Praça Alfredo Egydio de Souza Aranha',
    number: '100',
    complement: '',
    neighborhood: 'Jabaquara',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '04344902',
  },
  'Postal Saúde': {
    cnpj: '35832247000140',
    phone: '08007250505',
    email: 'atendimento@postalsaude.com.br',
    website: 'https://www.postalsaude.com.br',
    street: 'SCS Quadra 2 Bloco C',
    number: '170',
    complement: '',
    neighborhood: 'Asa Sul',
    city: 'Brasília',
    state: 'DF',
    zipCode: '70302914',
  },
  'São Francisco Saúde': {
    cnpj: '01613433000143',
    phone: '08007272800',
    email: 'relacionamento@sfrancisco.com.br',
    website: 'https://www.sfrancisco.com.br',
    street: 'Rua dos Pinheiros',
    number: '498',
    complement: '',
    neighborhood: 'Pinheiros',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '05422001',
  },
  'Mediservice': {
    cnpj: '01600778000183',
    phone: '08007296001',
    email: 'atendimento@mediservice.com.br',
    website: 'https://www.mediservice.com.br',
    street: 'Avenida Paulista',
    number: '1842',
    complement: 'Torre Norte',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310200',
  },
  'One Health': {
    cnpj: '02926892000106',
    phone: '08007738020',
    email: 'contato@onehealth.com.br',
    website: 'https://www.onehealth.com.br',
    street: 'Avenida Paulista',
    number: '1159',
    complement: 'Conj. 401',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01311200',
  },
  'Omint': {
    cnpj: '48755946000143',
    phone: '08007706466',
    email: 'atendimento@omint.com.br',
    website: 'https://www.omint.com.br',
    street: 'Avenida Faria Lima',
    number: '4100',
    complement: '6º andar',
    neighborhood: 'Itaim Bibi',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '04538132',
  },
  'Allianz Saúde': {
    cnpj: '73079430000170',
    phone: '08007720708',
    email: 'saude@allianz.com.br',
    website: 'https://www.allianz.com.br/saude',
    street: 'Rua Eugênio de Medeiros',
    number: '303',
    complement: '',
    neighborhood: 'Pinheiros',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '05425000',
  },
  'QSaúde': {
    cnpj: '30995819000157',
    phone: '08007734040',
    email: 'contato@qsaude.com.br',
    website: 'https://www.qsaude.com.br',
    street: 'Rua Fidêncio Ramos',
    number: '308',
    complement: '',
    neighborhood: 'Vila Olímpia',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '04551010',
  },
  'Alice': {
    cnpj: '33519379000144',
    phone: '08000200111',
    email: 'oi@alice.com.br',
    website: 'https://www.alice.com.br',
    street: 'Rua João Cachoeira',
    number: '278',
    complement: '',
    neighborhood: 'Itaim Bibi',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '04535010',
  },
  'Sami': {
    cnpj: '29361865000103',
    phone: '08000900100',
    email: 'oi@samisaude.com.br',
    website: 'https://www.samisaude.com.br',
    street: 'Avenida Rebouças',
    number: '1585',
    complement: '',
    neighborhood: 'Pinheiros',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '05401450',
  },
  'Kipp Saúde': {
    cnpj: '36217961000142',
    phone: '08007730005',
    email: 'oi@kippsaude.com.br',
    website: 'https://www.kippsaude.com.br',
    street: 'Avenida Brigadeiro Faria Lima',
    number: '2277',
    complement: '',
    neighborhood: 'Jardim Paulistano',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01452000',
  },
  'Petrobras Saúde': {
    cnpj: '30063346000172',
    phone: '08007712012',
    email: 'ams@petrobras.com.br',
    website: 'https://www.ams.petrobras.com.br',
    street: 'Avenida República do Chile',
    number: '65',
    complement: '',
    neighborhood: 'Centro',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zipCode: '20031912',
  },
  'Saúde Caixa': {
    cnpj: '33658957000157',
    phone: '08007261616',
    email: 'saudecaixa@caixa.gov.br',
    website: 'https://www.saudecaixa.com.br',
    street: 'SBS Quadra 4 Bloco A',
    number: '100',
    complement: '',
    neighborhood: 'Asa Sul',
    city: 'Brasília',
    state: 'DF',
    zipCode: '70092900',
  },
  'Economus': {
    cnpj: '61697948000101',
    phone: '08007712010',
    email: 'atendimento@economus.com.br',
    website: 'https://www.economus.com.br',
    street: 'Rua Líbero Badaró',
    number: '425',
    complement: '',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01009905',
  },
  'Funpresp': {
    cnpj: '19473772000154',
    phone: '08007290505',
    email: 'atendimento@funpresp.com.br',
    website: 'https://www.funpresp.com.br',
    street: 'SCN Quadra 2 Bloco A',
    number: '200',
    complement: '',
    neighborhood: 'Asa Norte',
    city: 'Brasília',
    state: 'DF',
    zipCode: '70712900',
  },
  'Santa Casa Saúde': {
    cnpj: '65696003000190',
    phone: '08007710909',
    email: 'atendimento@santacasasaude.com.br',
    website: 'https://www.santacasasaude.com.br',
    street: 'Rua Dr. Cesário Mota Jr.',
    number: '112',
    complement: '',
    neighborhood: 'Vila Buarque',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01221020',
  },
  'Saúde BRB': {
    cnpj: '03254082000135',
    phone: '08006430303',
    email: 'saudebrb@brb.com.br',
    website: 'https://www.saudebrb.com.br',
    street: 'SBS Quadra 1 Bloco E',
    number: 'Ed. Brasília',
    complement: '',
    neighborhood: 'Asa Sul',
    city: 'Brasília',
    state: 'DF',
    zipCode: '70072900',
  },
  'HapClínica': {
    cnpj: '00797231000151',
    phone: '08007078090',
    email: 'atendimento@hapclinica.com.br',
    website: 'https://www.hapclinica.com.br',
    street: 'Avenida Heráclito Graça',
    number: '406',
    complement: '',
    neighborhood: 'Centro',
    city: 'Fortaleza',
    state: 'CE',
    zipCode: '60140061',
  },
}

// Lista das principais operadoras de saúde do Brasil (fonte: ANS e Valor 1000)
const operadoras = [
  { value: '', label: 'Selecione uma operadora...' },
  // Grandes operadoras nacionais
  { value: 'Hapvida NotreDame Intermédica', label: 'Hapvida NotreDame Intermédica' },
  { value: 'Bradesco Saúde', label: 'Bradesco Saúde' },
  { value: 'SulAmérica Saúde', label: 'SulAmérica Saúde' },
  { value: 'Amil', label: 'Amil' },
  { value: 'Unimed Nacional', label: 'Unimed Nacional (Central Nacional Unimed)' },
  { value: 'Seguros Unimed', label: 'Seguros Unimed' },
  { value: 'Porto Seguro Saúde', label: 'Porto Seguro Saúde' },
  { value: 'Prevent Senior', label: 'Prevent Senior' },
  { value: 'Care Plus', label: 'Care Plus' },
  // Unimeds regionais
  { value: 'Unimed Belo Horizonte', label: 'Unimed Belo Horizonte' },
  { value: 'Unimed Rio', label: 'Unimed Rio' },
  { value: 'Unimed São Paulo', label: 'Unimed São Paulo (Unimed Paulistana)' },
  { value: 'Unimed Campinas', label: 'Unimed Campinas' },
  { value: 'Unimed Curitiba', label: 'Unimed Curitiba' },
  { value: 'Unimed Porto Alegre', label: 'Unimed Porto Alegre' },
  { value: 'Unimed Fortaleza', label: 'Unimed Fortaleza' },
  { value: 'Unimed Recife', label: 'Unimed Recife' },
  { value: 'Unimed Salvador', label: 'Unimed Salvador' },
  { value: 'Unimed Vitória', label: 'Unimed Vitória' },
  { value: 'Unimed Goiânia', label: 'Unimed Goiânia' },
  { value: 'Unimed Brasília', label: 'Unimed Brasília' },
  // Outras operadoras relevantes
  { value: 'Golden Cross', label: 'Golden Cross' },
  { value: 'Greenline Saúde', label: 'Greenline Saúde' },
  { value: 'Assim Saúde', label: 'Assim Saúde' },
  { value: 'Cassi', label: 'Cassi (Caixa de Assistência BB)' },
  { value: 'Geap Saúde', label: 'Geap Saúde' },
  { value: 'Fundação Saúde Itaú', label: 'Fundação Saúde Itaú' },
  { value: 'Postal Saúde', label: 'Postal Saúde' },
  { value: 'São Francisco Saúde', label: 'São Francisco Saúde' },
  { value: 'Mediservice', label: 'Mediservice' },
  { value: 'One Health', label: 'One Health' },
  { value: 'Omint', label: 'Omint' },
  { value: 'Allianz Saúde', label: 'Allianz Saúde' },
  { value: 'QSaúde', label: 'QSaúde' },
  { value: 'Alice', label: 'Alice' },
  { value: 'Sami', label: 'Sami' },
  { value: 'Kipp Saúde', label: 'Kipp Saúde' },
  // Cooperativas e autogestões
  { value: 'Petrobras Saúde', label: 'Petrobras Saúde (AMS)' },
  { value: 'Saúde Caixa', label: 'Saúde Caixa' },
  { value: 'Economus', label: 'Economus' },
  { value: 'Funpresp', label: 'Funpresp Saúde' },
  // Regionais
  { value: 'Santa Casa Saúde', label: 'Santa Casa Saúde' },
  { value: 'Saúde BRB', label: 'Saúde BRB' },
  { value: 'HapClínica', label: 'HapClínica' },
  { value: 'Outro', label: 'Outra (especificar)' },
]

const healthInsuranceSchema = z.object({
  name: z.string().min(1, 'Selecione uma operadora'),
  customName: z.string().optional(),
  cnpj: z.string().length(14, 'CNPJ deve ter 14 dígitos'),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('Email inválido'),
  website: z.string().optional(),
  street: z.string().min(3, 'Endereço é obrigatório'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado deve ter 2 letras'),
  zipCode: z.string().length(8, 'CEP deve ter 8 dígitos'),
  // OAuth fields
  oauthEnabled: z.boolean().optional(),
  oauthClientId: z.string().optional(),
  oauthClientSecret: z.string().optional(),
  oauthAuthUrl: z.string().optional(),
  oauthTokenUrl: z.string().optional(),
  oauthUserInfoUrl: z.string().optional(),
  oauthScope: z.string().optional(),
  oauthRedirectUri: z.string().optional(),
})

type HealthInsuranceFormData = z.infer<typeof healthInsuranceSchema>

export default function NewHealthInsurancePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCustomName, setShowCustomName] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<HealthInsuranceFormData>({
    resolver: zodResolver(healthInsuranceSchema),
  })

  const selectedName = watch('name')

  const handleNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const operadoraName = e.target.value
    setShowCustomName(operadoraName === 'Outro')

    // Auto-preencher dados da operadora selecionada
    const data = operadorasData[operadoraName]
    if (data) {
      setValue('cnpj', data.cnpj)
      setValue('phone', data.phone)
      setValue('email', data.email)
      setValue('website', data.website)
      setValue('street', data.street)
      setValue('number', data.number)
      setValue('complement', data.complement)
      setValue('neighborhood', data.neighborhood)
      setValue('city', data.city)
      setValue('state', data.state)
      setValue('zipCode', data.zipCode)
    } else if (operadoraName === 'Outro' || operadoraName === '') {
      // Limpar campos se for "Outro" ou vazio
      setValue('cnpj', '')
      setValue('phone', '')
      setValue('email', '')
      setValue('website', '')
      setValue('street', '')
      setValue('number', '')
      setValue('complement', '')
      setValue('neighborhood', '')
      setValue('city', '')
      setValue('state', '')
      setValue('zipCode', '')
    }
  }

  const onSubmit = async (data: HealthInsuranceFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const finalName = data.name === 'Outro' && data.customName ? data.customName : data.name

      const payload = {
        ...data,
        name: finalName,
        partnerHospitals: [],
        oauthEnabled: data.oauthEnabled || false,
      }
      delete (payload as any).customName

      await api.post('/health-insurances', payload)
      router.push('/dashboard/health-insurance')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao cadastrar operadora')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <RoleGuard allowedRoles={['SYSTEM_ADMIN', 'HEALTH_INSURANCE_ADMIN']}>
      <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Nova Operadora de Saúde</h2>
          <p className="text-muted-foreground">
            Cadastre uma nova operadora de plano de saúde
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações da Operadora</CardTitle>
            <CardDescription>Selecione a operadora de saúde cadastrada na ANS</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Operadora *</Label>
              <select
                id="name"
                {...register('name')}
                onChange={(e) => {
                  register('name').onChange(e)
                  handleNameChange(e)
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {operadoras.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            {showCustomName && (
              <div className="space-y-2">
                <Label htmlFor="customName">Nome da Operadora *</Label>
                <Input
                  id="customName"
                  {...register('customName')}
                  placeholder="Digite o nome da operadora"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input id="cnpj" {...register('cnpj')} placeholder="12345678000199" maxLength={14} />
              {errors.cnpj && <p className="text-sm text-destructive">{errors.cnpj.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input id="phone" {...register('phone')} placeholder="0800999999" />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register('email')} placeholder="contato@operadora.com" />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" {...register('website')} placeholder="https://www.operadora.com.br" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
            <CardDescription>Endereço da sede da operadora</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="street">Logradouro *</Label>
              <Input id="street" {...register('street')} placeholder="Avenida Paulista" />
              {errors.street && <p className="text-sm text-destructive">{errors.street.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">Número *</Label>
              <Input id="number" {...register('number')} placeholder="1000" />
              {errors.number && <p className="text-sm text-destructive">{errors.number.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input id="complement" {...register('complement')} placeholder="Sala 100" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro *</Label>
              <Input id="neighborhood" {...register('neighborhood')} placeholder="Bela Vista" />
              {errors.neighborhood && <p className="text-sm text-destructive">{errors.neighborhood.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Cidade *</Label>
              <Input id="city" {...register('city')} placeholder="São Paulo" />
              {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado *</Label>
              <Input id="state" {...register('state')} placeholder="SP" maxLength={2} />
              {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">CEP *</Label>
              <Input id="zipCode" {...register('zipCode')} placeholder="01310100" maxLength={8} />
              {errors.zipCode && <p className="text-sm text-destructive">{errors.zipCode.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Integração OAuth (Opcional)</CardTitle>
            </div>
            <CardDescription>
              Configure a integração OAuth para permitir que pacientes importem seus dados automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="oauthEnabled"
                  {...register('oauthEnabled')}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="oauthEnabled" className="font-normal">
                  Habilitar integração OAuth para sincronização de dados
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="oauthClientId">Client ID</Label>
              <Input id="oauthClientId" {...register('oauthClientId')} placeholder="client_id_here" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oauthClientSecret">Client Secret</Label>
              <Input id="oauthClientSecret" type="password" {...register('oauthClientSecret')} placeholder="••••••••" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oauthAuthUrl">URL de Autorização</Label>
              <Input id="oauthAuthUrl" {...register('oauthAuthUrl')} placeholder="https://oauth.operadora.com/authorize" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oauthTokenUrl">URL do Token</Label>
              <Input id="oauthTokenUrl" {...register('oauthTokenUrl')} placeholder="https://oauth.operadora.com/token" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oauthUserInfoUrl">URL de User Info</Label>
              <Input id="oauthUserInfoUrl" {...register('oauthUserInfoUrl')} placeholder="https://api.operadora.com/userinfo" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oauthScope">Escopos</Label>
              <Input id="oauthScope" {...register('oauthScope')} placeholder="openid profile email" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="oauthRedirectUri">URI de Callback</Label>
              <Input
                id="oauthRedirectUri"
                {...register('oauthRedirectUri')}
                placeholder="https://medgo-frontend.vercel.app/oauth/callback"
                defaultValue={typeof window !== 'undefined' ? `${window.location.origin}/oauth/callback` : ''}
              />
              <p className="text-xs text-muted-foreground">
                Esta URL deve ser registrada como URI de callback no painel OAuth da operadora
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cadastrar Operadora
          </Button>
        </div>
      </form>
      </div>
    </RoleGuard>
  )
}
