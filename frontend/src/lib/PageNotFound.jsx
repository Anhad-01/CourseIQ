import { ArrowLeft, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'

function PageNotFound() {
  return (
    <section className="section-shell flex min-h-[70vh] items-center justify-center">
      <div className="glass-panel max-w-xl p-10 text-center">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Search className="size-8" />
        </div>

        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
          404
        </p>

        <h1 className="mt-3 text-4xl font-semibold">
          This page is off the learning path
        </h1>

        <p className="mt-3 text-muted-foreground">
          The route you tried doesn&apos;t exist in this frontend build yet.
          Head back to search and continue exploring courses.
        </p>

        <div className="mt-8 flex justify-center">
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 size-4" />
              Back to search
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default PageNotFound
