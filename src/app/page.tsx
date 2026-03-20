export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background">
      <img
        src="/metlife-logo.png"
        alt="MetLife"
        className="h-12 mb-8"
      />
      <h1 className="text-3xl font-bold text-primary-dark mb-4">
        Espace Prospect Intelligent
      </h1>
      <p className="text-lg text-foreground/70 max-w-md text-center mb-8">
        Découvrez comment MetLife peut protéger votre activité de TNS.
      </p>
      <div className="flex gap-4">
        <div className="w-4 h-4 rounded-full bg-metlife-blue" title="MetLife Blue #0090DA" />
        <div className="w-4 h-4 rounded-full bg-metlife-navy" title="MetLife Navy #0061A0" />
        <div className="w-4 h-4 rounded-full bg-metlife-green" title="MetLife Green #A4CE4E" />
        <div className="w-4 h-4 rounded-full bg-metlife-dark" title="MetLife Dark #333333" />
      </div>
    </main>
  );
}
