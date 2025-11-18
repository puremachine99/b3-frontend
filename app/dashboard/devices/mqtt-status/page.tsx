export default function Page() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">MQTT Status</h1>
      <p className="text-muted-foreground">
        Placeholder for MQTT broker monitoring. Connect this page to the real status endpoint to show broker health,
        connection history, and topic throughput.
      </p>
    </div>
  )
}
