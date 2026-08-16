import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import ProjectCreateForm from "@/components/ProjectCreateForm";

export default function CreateProject() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-12 pb-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-2">Lanzar una idea</h1>
          <p className="text-muted-foreground mb-8">
            La plataforma no crea proyectos. Hace que la gente se atreva a crearlos.
          </p>
        </motion.div>
        <ProjectCreateForm />
      </div>
    </Layout>
  );
}