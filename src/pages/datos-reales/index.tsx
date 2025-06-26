import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import Mapa from '@/components/Mapa'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_LIST_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Dispositivo = {
    id: string
    NOMBRE: string
    device_id: string
    LAT: number
    LON: number
}

export default function DatosReales() {
    const [dispositivos, setDispositivos] = useState<Dispositivo[]>([])
    const [activeTab, setActiveTab] = useState<'lista' | 'mapa'>('lista')

    useEffect(() => {
        const fetchDispositivos = async () => {
            const { data, error } = await supabase
                .from('TTDISPOSITIVOS')
                .select('id, NOMBRE, device_id,LAT, LON')
            console.log(data)
            if (error) console.error(error)
            else setDispositivos(data)
        }

        fetchDispositivos()
    }, [])

    return (
        <div style={{ width: '100%', top: '0' }}>
            <div className='indexSimulador'>
                <div className='card-container'>
                    <div className="lista-container">
                        {dispositivos.map((d) => (
                            <Link href={`/datos-reales/${d.device_id}`} key={d.id} className="lista-item link">
                                <h2>{d.NOMBRE}</h2>
                                <p>ID: {d.device_id}</p>
                            </Link>
                        ))}
                    </div>
                </div>
                <div className='card-container'>
                    <div className="lista-container">
                        <Mapa
                            estaciones={dispositivos.map((d) => ({
                                nombre: d.NOMBRE,
                                indicativo: d.device_id,
                                latitud: d.LAT,
                                longitud: d.LON
                            }))} base={'datos-reales'} />
                    </div>
                </div>
            </div>
        </div>
    )
}
