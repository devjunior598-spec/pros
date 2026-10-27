"use client"

import { useLayoutEffect, useRef } from "react"
import { Input, type InputProps } from "@/components/ui/input"
import { formatBillAmount } from "@/lib/bill-defaults"

type CurrencyInputProps = Omit<InputProps, "value" | "onChange" | "type" | "inputMode"> & {
    value: string
    onValueChange: (value: string) => void
}

export function CurrencyInput({ value, onValueChange, ...props }: CurrencyInputProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const caretRef = useRef<number | null>(null)

    useLayoutEffect(() => {
        if (caretRef.current !== null) {
            inputRef.current?.setSelectionRange(caretRef.current, caretRef.current)
            caretRef.current = null
        }
    }, [value])

    return <Input {...props} ref={inputRef} type="text" inputMode="decimal" maxLength={24}
        value={formatBillAmount(value)}
        onKeyDown={event => {
            props.onKeyDown?.(event)
            if (event.defaultPrevented) return
            const input = event.currentTarget
            const position = input.selectionStart ?? 0
            if (position !== input.selectionEnd) return
            if (event.key === "Backspace" && input.value[position - 1] === ",") input.setSelectionRange(position - 1, position - 1)
            if (event.key === "Delete" && input.value[position] === ",") input.setSelectionRange(position + 1, position + 1)
        }}
        onChange={event => {
            const input = event.currentTarget
            const raw = input.value.replaceAll(",", "")
            if (!/^\d*(?:\.\d{0,2})?$/.test(raw)) return
            const next = raw.startsWith(".") ? `0${raw}` : raw
            const beforeCaret = input.value.slice(0, input.selectionStart ?? input.value.length).replaceAll(",", "").length + (raw.startsWith(".") ? 1 : 0)
            const formatted = formatBillAmount(next)
            let position = 0
            let characters = 0
            while (position < formatted.length && characters < beforeCaret) {
                if (formatted[position] !== ",") characters++
                position++
            }
            caretRef.current = position
            onValueChange(next)
        }} />
}
