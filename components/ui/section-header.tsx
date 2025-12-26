interface SectionHeaderProps {
  title: string
  subtitle?: string
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="pb-6 border-b border-[#D6CDBF]/50 mb-8">
        <h2 className="text-3xl font-serif text-[#4A4238]">{title}</h2>
        {subtitle && <p className="text-lg opacity-60 mt-1">{subtitle}</p>}
    </div>
  )
}
