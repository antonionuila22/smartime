import * as React from 'react'

import { Label } from '@/components/ui/label'
import { InlineError } from '@/components/ui/inline-error'
import { cn } from '@/utilities/ui'

/**
 * Estilo ÚNICO de control de formulario (input/select/textarea). Antes cada formulario lo repetía
 * como string de Tailwind y ya divergían. Exportado para que select/textarea compartan el mismo look.
 */
export const fieldControlClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition duration-300 hover:border-primary/40 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60'

/**
 * Campo de formulario COMPUESTO: Label + input + hint + error (InlineError), con el cableado de
 * accesibilidad hecho una sola vez (htmlFor/id, aria-invalid, aria-describedby). Reemplaza las dos
 * copias privadas de `Field` (checkout, cuenta/direcciones) y los inputs con label a mano.
 *
 * Conserva la convención del proyecto `onChange: (value) => void` (no el evento nativo) para que la
 * migración de los formularios existentes sea directa. `className` es del CONTENEDOR (p. ej. col-span).
 */
export type FieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string | null
  hint?: string
  required?: boolean
  className?: string
  type?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  autoComplete?: string
  name?: string
  placeholder?: string
  disabled?: boolean
  id?: string
}

export const Field: React.FC<FieldProps> = ({
  label,
  value,
  onChange,
  error,
  hint,
  required,
  className,
  type = 'text',
  inputMode,
  autoComplete,
  name,
  placeholder,
  disabled,
  id,
}) => {
  const autoId = React.useId()
  const fieldId = id ?? `field-${autoId}`
  const errId = `${fieldId}-error`
  const hintId = `${fieldId}-hint`
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={fieldId}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <input
        id={fieldId}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : hint ? hintId : undefined}
        className={fieldControlClass}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <InlineError id={errId}>{error}</InlineError>
    </div>
  )
}
