
type AlertProps = {
    mes: String| string
}

export const ErrorAlert = ({mes}:AlertProps): JSX.Element => {
    return (
        <div className="alert border-l-red-600">
            <h2 className="font-semibold">Error Message</h2>
            <span>{mes}</span>
        </div>
    )
}

export const SuccessAlert = ({mes}:AlertProps): JSX.Element => {
    return (
        <div className="alert border-l-green-700">
            <h2 className="font-semibold">Successful Message</h2>
            <span>{mes}</span>
        </div>
    )
}

export const WarningAlert = ({mes}:AlertProps): JSX.Element => {
    return (
        <div className="alert border-l-orange-700">
            <h2 className="font-semibold">Message</h2>
            <span>{mes}</span>
        </div>
    )
}