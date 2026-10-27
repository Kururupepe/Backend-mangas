import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { v7 } from 'uuid'
import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync('./temp.sql');

const app = new Hono()
let contador = 0
app.get('/', (c) => {
  contador = contador + 1
  return c.text('Hello Kururu! ' + contador)
})

let mangas = db.prepare("SELECT * from mangas").all()

function exists(nombre: String, autor: String) {
  return mangas.some(me => me.nombre === nombre && me.autor === autor)
}

app.get("/mangas", (c) => {
  return c.json(mangas)
})

app.get("/mangas/:id", (c) => {
  const id = c.req.param("id")
  return c.json(mangas.filter((m) => {
    return m.id == (id)
  }))
})

app.post("/mangas", async (c) => {
  let m = await c.req.json()
  let mn = {
    nombre: "",
    autor: "",
    id: v7(),
    rating: 1,
  }

  if (Object.hasOwn(m, "nombre") && Object.hasOwn(m, "autor")) {
    mn.nombre = m.nombre
    mn.autor = m.autor
    if (!exists(mn.nombre, mn.autor)) {
      mangas.push(mn)
    } else {
      return c.text("Ya existe este manga en la lista")
    }
  } else {
    return c.text("Contenido no valido")
  }
  return c.json(mn)
})

app.patch("/mangas/:id", async (c) => {
  const id = c.req.param("id")
  //manga del body
  const mb = await c.req.json()
  let manga = mangas.find((manga) => manga.id === id)

  if (!manga) {
    return c.json({ error: "Manga not found" }, 404)
  }

  const mn = {
    nombre: manga.nombre,
    autor: manga.autor,
    id: manga.id,
    rating: manga.rating,
  }

  if (mb.nombre !== undefined) {
    mn.nombre = mb.nombre
  }

  if (mb.autor !== undefined) {
    mn.autor = mb.autor
  }

  if (mb.rating !== undefined) {
    mn.rating = mb.rating
  }

  if (exists(mn.nombre, mn.autor) && mb.nombre !== undefined || mb.autor !== undefined) {
    return c.text("Ya existe un manga con este nombre y autor en la lista")
  }

  manga.nombre = mn.nombre
  manga.autor = mn.autor
  manga.rating = mn.rating

  return c.json(mn)
})

app.delete("/mangas/:id", (c) => {
  const id = c.req.param("id")

  const mangaIndex = mangas.findIndex((manga) => manga.id === id)

  if (mangaIndex === -1) {
    return c.json({ error: "Manga not found" }, 404)
  }

  mangas.splice(mangaIndex, 1)

  return c.json({
    message: "Manga deleted succesfully"
  })
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
