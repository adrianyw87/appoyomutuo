import React from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";

export default function Privacidad() {
  return (
    <Layout>
      <article className="max-w-2xl mx-auto px-4 sm:px-6 pt-12 pb-20 prose prose-slate">
        <h1 className="font-heading text-3xl font-bold mb-4">Privacidad</h1>
        <p className="text-muted-foreground mb-6">
          Appoyo Mutuo es un proyecto social sin ánimo de lucro. Tratamos los datos
          mínimos necesarios para que la comunidad pueda organizarse.
        </p>
        <h2 className="font-heading text-xl font-semibold mt-8 mb-2">Qué datos guardamos</h2>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li>Cuenta: email y nombre (si usas Google u otro proveedor).</li>
          <li>Perfil público: biografía, barrio, intereses, lo que ofreces/buscas.</li>
          <li>Proyectos, membresías, tareas, anuncios y mensajes de los espacios en los que participas.</li>
          <li>Imágenes que subas (avatar o foto de proyecto).</li>
        </ul>
        <h2 className="font-heading text-xl font-semibold mt-8 mb-2">Para qué</h2>
        <p className="text-muted-foreground">
          Autenticarte, mostrar proyectos, permitir unirte a iniciativas y coordinar
          el trabajo en grupo. No vendemos datos ni hacemos publicidad dirigida.
        </p>
        <h2 className="font-heading text-xl font-semibold mt-8 mb-2">Dónde se alojan</h2>
        <p className="text-muted-foreground">
          Backend y base de datos en Supabase; frontend en Cloudflare Pages (u otro
          host que elijáis). Preferimos región UE cuando esté disponible.
        </p>
        <h2 className="font-heading text-xl font-semibold mt-8 mb-2">Tus derechos</h2>
        <p className="text-muted-foreground">
          Puedes editar tu perfil, borrar contenidos que hayas creado (según permisos)
          y solicitar la eliminación de tu cuenta escribiendo a quien administre la
          instancia. Actualizaremos esta página con un contacto formal cuando esté definido.
        </p>
        <p className="mt-10">
          <Link to="/" className="text-primary hover:underline">
            Volver al inicio
          </Link>
        </p>
      </article>
    </Layout>
  );
}
