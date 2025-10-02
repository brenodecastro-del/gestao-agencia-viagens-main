"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, X } from 'lucide-react'

interface Configuracao {
  nome_agencia: string
  percentual_comissao_padrao: number
  dias_alerta_inatividade: number
  cores_marca: { primaria: string; secundaria: string }
  origens_clientes: string[]
  operadoras_default: string[]
  servicos_default: string[]
}

interface ConfigFormProps {
  config: Configuracao
  onSave: (config: Configuracao) => void
  onCancel: () => void
}

export default function ConfigForm({ config, onSave, onCancel }: ConfigFormProps) {
  const [formData, setFormData] = useState<Configuracao>(config)
  const [newOrigem, setNewOrigem] = useState('')
  const [newOperadora, setNewOperadora] = useState('')
  const [newServico, setNewServico] = useState('')

  useEffect(() => {
    setFormData(config)
  }, [config])

  const addOrigem = () => {
    if (newOrigem.trim() && !formData.origens_clientes.includes(newOrigem.trim())) {
      setFormData({
        ...formData,
        origens_clientes: [...formData.origens_clientes, newOrigem.trim()]
      })
      setNewOrigem('')
    }
  }

  const removeOrigem = (origem: string) => {
    setFormData({
      ...formData,
      origens_clientes: formData.origens_clientes.filter(o => o !== origem)
    })
  }

  const addOperadora = () => {
    if (newOperadora.trim() && !formData.operadoras_default.includes(newOperadora.trim())) {
      setFormData({
        ...formData,
        operadoras_default: [...formData.operadoras_default, newOperadora.trim()]
      })
      setNewOperadora('')
    }
  }

  const removeOperadora = (operadora: string) => {
    setFormData({
      ...formData,
      operadoras_default: formData.operadoras_default.filter(o => o !== operadora)
    })
  }

  const addServico = () => {
    if (newServico.trim() && !formData.servicos_default.includes(newServico.trim())) {
      setFormData({
        ...formData,
        servicos_default: [...formData.servicos_default, newServico.trim()]
      })
      setNewServico('')
    }
  }

  const removeServico = (servico: string) => {
    setFormData({
      ...formData,
      servicos_default: formData.servicos_default.filter(s => s !== servico)
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome_agencia">Nome da Agência</Label>
              <Input
                id="nome_agencia"
                value={formData.nome_agencia}
                onChange={(e) => setFormData({ ...formData, nome_agencia: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="percentual_comissao_padrao">Percentual Comissão Padrão (%)</Label>
              <Input
                id="percentual_comissao_padrao"
                type="number"
                step="0.01"
                value={formData.percentual_comissao_padrao}
                onChange={(e) => setFormData({ ...formData, percentual_comissao_padrao: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="dias_alerta_inatividade">Dias para Alerta de Inatividade</Label>
              <Input
                id="dias_alerta_inatividade"
                type="number"
                value={formData.dias_alerta_inatividade}
                onChange={(e) => setFormData({ ...formData, dias_alerta_inatividade: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Cores da marca */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cor_primaria">Cor Primária</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="cor_primaria"
                  type="color"
                  value={formData.cores_marca.primaria}
                  onChange={(e) => setFormData({
                    ...formData,
                    cores_marca: { ...formData.cores_marca, primaria: e.target.value }
                  })}
                  className="w-16 h-10"
                />
                <Input
                  value={formData.cores_marca.primaria}
                  onChange={(e) => setFormData({
                    ...formData,
                    cores_marca: { ...formData.cores_marca, primaria: e.target.value }
                  })}
                  className="font-mono"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cor_secundaria">Cor Secundária</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="cor_secundaria"
                  type="color"
                  value={formData.cores_marca.secundaria}
                  onChange={(e) => setFormData({
                    ...formData,
                    cores_marca: { ...formData.cores_marca, secundaria: e.target.value }
                  })}
                  className="w-16 h-10"
                />
                <Input
                  value={formData.cores_marca.secundaria}
                  onChange={(e) => setFormData({
                    ...formData,
                    cores_marca: { ...formData.cores_marca, secundaria: e.target.value }
                  })}
                  className="font-mono"
                />
              </div>
            </div>
          </div>

          {/* Origens de clientes */}
          <div>
            <Label>Origens de Clientes</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Nova origem..."
                value={newOrigem}
                onChange={(e) => setNewOrigem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOrigem())}
              />
              <Button type="button" onClick={addOrigem} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.origens_clientes.map((origem) => (
                <Badge key={origem} variant="outline" className="flex items-center gap-1">
                  {origem}
                  <button
                    type="button"
                    onClick={() => removeOrigem(origem)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Operadoras padrão */}
          <div>
            <Label>Operadoras Padrão</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Nova operadora..."
                value={newOperadora}
                onChange={(e) => setNewOperadora(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOperadora())}
              />
              <Button type="button" onClick={addOperadora} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.operadoras_default.map((operadora) => (
                <Badge key={operadora} variant="outline" className="flex items-center gap-1">
                  {operadora}
                  <button
                    type="button"
                    onClick={() => removeOperadora(operadora)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Serviços padrão */}
          <div>
            <Label>Serviços Disponíveis</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Novo serviço..."
                value={newServico}
                onChange={(e) => setNewServico(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addServico())}
              />
              <Button type="button" onClick={addServico} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.servicos_default.map((servico) => (
                <Badge key={servico} variant="outline" className="flex items-center gap-1">
                  {servico}
                  <button
                    type="button"
                    onClick={() => removeServico(servico)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#09A66D] hover:bg-[#08955f]">
              Salvar Configurações
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}