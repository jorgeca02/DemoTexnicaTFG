import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID de estación inválido' })
  }

  const filePath = path.join(process.cwd(), 'data', 'datos_aemet_final_imputado.csv')

  fs.readFile(filePath, 'utf8', (err, csvData) => {
    if (err) {
      console.error('❌ Error al leer el CSV:', err)
      return res.status(500).json({ error: 'Error al leer el archivo' })
    }

    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true
    })

    const data = parsed.data as any[]
    const filtrado = data.filter(row => row.indicativo === id)

    res.status(200).json(filtrado)
  })
}

  