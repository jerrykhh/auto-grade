import React, { HTMLAttributes } from "react";


const Header = ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => {
    return (
        <thead className="bg-gray-50" {...props}>
            {children}
        </thead>
    )
}

const Row = ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => {
    return <tr {...props}>{children}</tr>
}


const Body = ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => {
    return <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
}

const HeaderCell = ({ children, ...props }: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) => {
    return (
        <th {...props} scope="col" className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}>
            {children}
        </th>
    )
}

const Cell = ({ children, ...props }: React.TdHTMLAttributes<HTMLTableDataCellElement>) => {
    return <td className={`px-6 py-4 whitespace-nowrap`} {...props}>{children}</td>
}


type TableProps = {
    title?: string
    description?: string
    children: React.ReactNode
}

const Table = ({ title, description, children }: TableProps): JSX.Element => {
    return (
        <React.Fragment>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                {title ?
                    <div className="px-4 py-5 sm:px-6 border-b-2 border-gray-100">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
                        {
                            description &&
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">{description}</p>
                        }
                    </div> : <></>
                }

                <div className="p-5">
                    <div className="flex flex-col">
                        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                                <table className="min-w-full divide-y divide-gray-200 border ">
                                    {children}
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </React.Fragment>



    )
}

Table.Body = Body
Table.Cell = Cell
Table.Header = Header
Table.HeaderCell = HeaderCell
Table.Row = Row

export default Table;