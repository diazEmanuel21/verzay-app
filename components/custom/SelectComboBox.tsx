"use client"

import { useState } from "react"
import { Session } from "@prisma/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"

interface Props {
  leads: Session[]
  onSelect: (lead: Session) => void
  onLeadCreated: () => void // para recargar leads luego de crear
}

export const SelectComboBox = ({ leads, onSelect, onLeadCreated }: Props) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [createLead, setCreateLead] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? leads.find((lead) => `${lead.pushName} ${lead.remoteJid}` === value)?.pushName
            : "Select framework..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search framework..." className="h-9" />
          <CommandList>
            <CommandEmpty>
              <div className="p-2 text-sm text-center">
                No se encontró ningún lead.
                <br />
                <Button
                  variant="link"
                  className="text-blue-500 mt-2"
                  onClick={() => {
                    setCreateLead(true)
                    setOpen(false)
                  }}
                >
                  + Crear nuevo lead
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {leads.map((lead) => (
                <CommandItem
                  key={lead.id}
                  value={`${lead.pushName} ${lead.remoteJid}`}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue)
                    onSelect(lead)
                    setOpen(false)
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{lead.pushName}</span>
                    <span className="text-muted-foreground text-xs">{lead.remoteJid.split("@")[0]}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto",
                      value === `${lead.pushName} ${lead.remoteJid}` ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}