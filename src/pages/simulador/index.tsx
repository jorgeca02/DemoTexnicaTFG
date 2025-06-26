import Link from 'next/link'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Papa from 'papaparse'

const Mapa = dynamic(() => import('@/components/Mapa'), { ssr: false })

interface EstacionCSV {
  indicativo: string
  nombre: string
  provincia: string
  latitud: string
  longitud: string
}

export default function Simulador() {
  const [estaciones, setEstaciones] = useState<EstacionCSV[]>([])
  const [activeTab, setActiveTab] = useState<'lista' | 'mapa'>('lista')

  useEffect(() => {
    const fetchCSV = async () => {
      const res = await fetch('/estaciones.csv')
      const text = await res.text()
      const parsed = Papa.parse<EstacionCSV>(text, {
        header: true,
        skipEmptyLines: true
      })
      const unicas = Array.from(new Map(parsed.data.map(e => [e.indicativo, e])).values())
      setEstaciones(unicas)
    }

    fetchCSV()
  }, [])

  return (
    <div className="indexSimulador">
      <div className='card-container'>
        <div className="lista-container">
          {estaciones.map((e) => (
            <Link
              href={`/simulador/${e.indicativo}`}
              key={e.indicativo}
              className="lista-item link"
            >
              <h2>{e.nombre}</h2>
              <p>ID: {e.indicativo}</p>
            </Link>
          ))}
        </div>
      </div>
      <div className='card-container'>
        <div className="lista-container">
          <Mapa
            estaciones={estaciones.map((e) => ({
              nombre: e.nombre,
              indicativo: e.indicativo,
              latitud: parseFloat(e.latitud),
              longitud: parseFloat(e.longitud)
            }))}
            base="/simulador"
          />
        </div>
      </div>
    </div>
  )
}
