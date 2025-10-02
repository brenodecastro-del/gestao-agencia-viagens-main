"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

interface Cliente {
  id: string
  nome_pagante: string
  cpf: string
  data_nascimento: string
  telefone: string
  email: string
  origem_cliente: string
  status_fidelidade: 'Bronze' | 'Prata' | 'Ouro' | 'Diamante'
  historico_compras: { num_reservas: number; valor_total: number }
  created_at: string
  updated_at: string
}

interface ClienteFormProps {
  cliente?: Cliente
  origens: string[]
  onSave: (cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>) => void
  onCancel: () => void
}

export default function ClienteForm({ cliente, origens, onSave, onCancel }: ClienteFormProps) {
  const [formData, setFormData] = useState({
    nome_pagante: '',
    cpf: '',
    data_nascimento: '',
    telefone: '',
    email: '',
    origem_cliente: '',
    status_fidelidade: 'Bronze' as const,
    historico_compras: { num_reservas: 0, valor_total: 0 }
  })

  useEffect(() => {
    if (cliente) {
      setFormData({
        nome_pagante: cliente.nome_pagante,
        cpf: cliente.cpf,
        data_nascimento: cliente.data_nascimento,
        telefone: cliente.telefone,
        email: cliente.email,
        origem_cliente: cliente.origem_cliente,
        status_fidelidade: cliente.status_fidelidade,
        historico_compras: cliente.historico_compras
      })
    }
  }, [cliente])

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '+55 ($1) $2-$3')
    }
    return value
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
    if (formatted.length <= 14) {
      setFormData({ ...formData, cpf: formatted })
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    if (formatted.length <= 20) {
      setFormData({ ...formData, telefone: formatted })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome_pagante">Nome do Pagante *</Label>
              <Input
                id="nome_pagante"
                value={formData.nome_pagante}
                onChange={(e) => setFormData({ ...formData, nome_pagante: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
                required
              />
            </div>

            <div>
              <Label htmlFor="data_nascimento">Data de Nascimento</Label>
              <Input
                id="data_nascimento"
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={handlePhoneChange}
                placeholder="+55 (00) 00000-0000"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="origem_cliente">Origem do Cliente</Label>
              <Select value={formData.origem_cliente} onValueChange={(value) => setFormData({ ...formData, origem_cliente: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  {origens.map((origem) => (
                    <SelectItem key={origem} value={origem}>{origem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status_fidelidade">Status de Fidelidade</Label>
              <Select value={formData.status_fidelidade} onValueChange={(value: any) => setFormData({ ...formData, status_fidelidade: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bronze">Bronze</SelectItem>
                  <SelectItem value="Prata">Prata</SelectItem>
                  <SelectItem value="Ouro">Ouro</SelectItem>
                  <SelectItem value="Diamante">Diamante</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#09A66D] hover:bg-[#08955f]">
              {cliente ? 'Atualizar' : 'Salvar'} Cliente
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}