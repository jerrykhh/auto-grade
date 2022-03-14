import { API, Auth, withSSRContext, } from "aws-amplify";
import { GRAPHQL_AUTH_MODE, GraphQLResult } from '@aws-amplify/api'
import { GetServerSideProps } from "next";
import React, { useEffect, useState } from "react";
import SystemPage from "../components/customize/template/SystemPage";
import Button from "../components/element/button";
import Modal from "../components/element/modal";
import Table from "../components/element/table";
import TextArea from "../components/input/textarea";
import Textfield from "../components/input/textfield";
import { Classroom } from "../interface/classroom";
import { listReviewClassroom } from "../lib/classroom/queries";
import { createClassroom, CreateClassroomMutation } from "../lib/classroom/mutations";
import { useRouter } from "next/router";
import { ErrorAlert, SuccessAlert } from "../components/element/alert";
import { EyeIcon } from "@heroicons/react/solid";

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
    const { Auth, API } = withSSRContext({ req });
    try {
        const identityId = await (await Auth.currentUserCredentials()).identityId;
        console.log(identityId);

        const { data } = await API.graphql({
            query: listReviewClassroom,
            variables: {
                teacherId: identityId
            }
        })
        

        return {
            props: {
                rooms: data.listClassrooms.items
            }
        }
    } catch (err) {
        console.log(err);

        // return {
        //     redirect: {
        //         permanent: false,
        //         destination: "/",
        //     },
        //     props: {},
        // }
    }

    return {
        props: {}
    }
}


const Classroom = ({ rooms }: { rooms: Array<Classroom> }) => {
    console.log("Classroom Page")
    console.log(rooms);
    
    const router = useRouter();
    const [createClassroomModal, setCreateClassrooModal] = useState<Boolean>(false);
    const [classroomName, setClassroomName] = useState<string>('');
    const [classroomDesc, setClassroomDesc] = useState<string>('');
    const [classroom, setClassroom] = useState<Array<Classroom>>(rooms);

    // Message
    const [portalMes, setPortalMes] = useState<String>("");
    const [modalMes, setModalMes] = useState<String>("");

    const onCreateClassroom = async () => {

        try {

            let identityId = null;
            try {
                identityId = await (await Auth.currentUserCredentials()).identityId;
            } catch {
                router.push("/");
            }

            if (identityId) {
                const newClassroom = await API.graphql({
                    query: createClassroom,
                    variables: {
                        classroom: {
                            teacherId: identityId,
                            name: classroomName,
                            description: classroomDesc
                        }
                    },
                    authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS
                }) as GraphQLResult<CreateClassroomMutation>
                
                
                if (newClassroom.data?.createClassroom){
                    const room = newClassroom.data?.createClassroom;
                    setClassroom([...classroom, room]);
                    setCreateClassrooModal(false);
                    setPortalMes(`Classroom ${room.name}(${room.id}) created.`)
                }

            }

        } catch (e) {
            setModalMes(`Create Classroom Failed, unknow error ${e}`)
        }

    }

    const goClassroom = (id:String) => {
        router.push(`classroom/${id}`)
    }

    // useEffect(() => {

    //     setClassroom([
    //         {
    //             id: "1",
    //             teacherId: "t1",
    //             name: "name",
    //             description: "desc"
    //         },
    //         {
    //             id: "1",
    //             teacherId: "t1",
    //             name: "name",
    //             description: "desc"
    //         }
    //     ])
    // }, [])

    return (
        <SystemPage
            pageTitle="Classroom"
            headerTitle="Classroom Page">
            {portalMes != ""?
                <SuccessAlert
                        mes={portalMes} />
                    :<></>
            }
            {createClassroomModal ?
                <Modal
                    header="Test">
                    <React.Fragment>
                        {modalMes != ""?
                            <ErrorAlert mes={modalMes} />
                                : <></>
                        }
                        <div className="row">
                            <Textfield type="text"
                                value={classroomName}
                                placeholder="Classroom Name"
                                onChange={(e) => setClassroomName(e.currentTarget.value)} />
                        </div>
                        <div className="row">
                            <TextArea
                                rows={3}
                                value={classroomDesc}
                                placeholder="Classroom Description"
                                onChange={(e) => setClassroomDesc(e.currentTarget.value)} />
                        </div>

                        <div className="modalfooter">
                            <div className="md:flex justify-end">
                                <div className="row mt-3">
                                    <button className="rounded p-2 cursor-pointer w-full md:w-auto md:px-8 border border-black"
                                        onClick={() => setCreateClassrooModal(false)}>Close</button>
                                </div>
                                <div className="row md:ml-3 mt-3">
                                    <Button className="md:text-right" onClick={() => onCreateClassroom()}>Create</Button>
                                </div>
                            </div>
                        </div>
                    </React.Fragment>
                </Modal>
                : <></>
            }
            <div className="row">
                <Button onClick={() => setCreateClassrooModal(!createClassroomModal)}>Create Classroom</Button>
            </div>
            <div className="row">
                <Table
                    title="Classroom">
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>Name</Table.HeaderCell>
                            <Table.HeaderCell>Description</Table.HeaderCell>
                            <Table.HeaderCell>Action</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {classroom == null || classroom.length == 0 ?
                            
                            <Table.Row>
                                <Table.Cell colSpan={3} className="text-center px-6 py-4 ">
                                    <span>No any data here</span>
                                </Table.Cell>
                            </Table.Row> :
                            classroom.map((room: Classroom, index: number) => {
                                return (
                                    <Table.Row key={index}>
                                        <Table.Cell>{room.name}</Table.Cell>
                                        <Table.Cell>{room.description}</Table.Cell>
                                        <Table.Cell>

                                            <button className="p-3 bg-violet-400 text-white rounded" onClick={() => goClassroom(room.id)}> 
                                                <EyeIcon className="w-5"></EyeIcon>
                                            </button>
                                        </Table.Cell>
                                    </Table.Row>
                                )
                            })
                        }
                    </Table.Body>
                </Table>
            </div>
        </SystemPage >
    );
}

export default Classroom;