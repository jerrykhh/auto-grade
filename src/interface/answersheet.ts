export type AnswerSheet = {
    id: String
    type: number
    classroomId: String
    name: String
    status: number
    file?: File
    locate?: Array<PDFLocate>
}

type PDFLocate = {
    qid: string
    tcode: string
    x: number
    y: number
    p_width: number
    p_hight: number
    answer: string
    answer_type: number
    page: number
}

type File = {
    bucket: string
    region: string
    uri: string
}