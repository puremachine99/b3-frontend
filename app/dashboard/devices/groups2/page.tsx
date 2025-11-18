import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const groups = [
  {
    id: "grp-jkt",
    name: "Jakarta Fleet",
    site: "Jakarta DC",
    devices: 58,
    status: "Healthy",
    lead: "Rudi Hartono",
  },
  {
    id: "grp-warehouse",
    name: "Warehouse Sensors",
    site: "Bandung WH",
    devices: 42,
    status: "Needs Attention",
    lead: "Sari Wulandari",
  },
  {
    id: "grp-retail",
    name: "Retail POS",
    site: "Surabaya Stores",
    devices: 36,
    status: "Healthy",
    lead: "Ferry Saputra",
  },
]

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
            <header className="space-y-1">
              <h1 className="text-2xl font-semibold">Device Groups</h1>
              <p className="text-muted-foreground">
                Manage logical clusters of devices. Use this page for bulk actions, membership updates, and monitoring.
              </p>
            </header>
            <section className="grid gap-4 md:grid-cols-3">
              {groups.map((group) => (
                <Card key={group.id} className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <CardDescription>{group.site}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Devices:</span> {group.devices}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Status:</span> {group.status}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Owner:</span> {group.lead}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </section>
            <Separator />
            <section className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold">Group Directory</h2>
                <p className="text-sm text-muted-foreground">
                  Replace the table data with the actual API payload (GET /groups) once available.
                </p>
              </div>
              <Card>
                <CardContent className="px-0 py-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6">Group</TableHead>
                        <TableHead>Site</TableHead>
                        <TableHead>Devices</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="pr-6 text-right">Owner</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groups.map((group) => (
                        <TableRow key={`${group.id}-row`}>
                          <TableCell className="pl-6 font-medium">{group.name}</TableCell>
                          <TableCell>{group.site}</TableCell>
                          <TableCell>{group.devices}</TableCell>
                          <TableCell>{group.status}</TableCell>
                          <TableCell className="pr-6 text-right">{group.lead}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
