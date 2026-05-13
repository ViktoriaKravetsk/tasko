export const PROJECT_DESCRIPTION_MAX_LENGTH = 200
export const PROJECT_DESCRIPTION_MAX_SEGMENT_LENGTH = 40
export const PROJECT_DESCRIPTION_SEGMENT_ERROR = `Description cannot contain a word or sequence longer than ${PROJECT_DESCRIPTION_MAX_SEGMENT_LENGTH} characters.`

export function getTodayDateInputValue(): string {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

export function isPastDateInputValue(value: string, todayValue = getTodayDateInputValue()): boolean {
    return value !== '' && value < todayValue
}

export function hasTooLongTextSegment(value: string, maxLength = PROJECT_DESCRIPTION_MAX_SEGMENT_LENGTH): boolean {
    return value
        .trim()
        .split(/\s+/)
        .some((segment) => segment.length > maxLength)
}
