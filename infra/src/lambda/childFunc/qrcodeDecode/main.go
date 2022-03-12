package main

import (
	"bytes"
	"context"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/liyue201/goqr"
)

type Event struct {
	S3ObjectKey string `json:"name"`
}

func getObject(key string) []byte {
	svc := s3.New(session.New(), &aws.Config{Region: aws.String(os.Getenv("REGION"))})
	params := &s3.GetObjectInput{
		Bucket: aws.String(os.Getenv("BUCKET")), // Required
		Key:    aws.String("tmp/" + key),        // Required
	}
	resp, _ := svc.GetObject(params)

	size := int(*resp.ContentLength)

	buffer := make([]byte, size)
	defer resp.Body.Close()
	var bbuffer bytes.Buffer
	for true {
		num, rerr := resp.Body.Read(buffer)
		if num > 0 {
			bbuffer.Write(buffer[:num])
		} else if rerr == io.EOF || rerr != nil {
			break
		}
	}
	return bbuffer.Bytes()
}

func recognizeFile(path string) (string, error) {
	// imgdata, err := ioutil.ReadFile(path)
	// if err != nil {
	// 	fmt.Printf("%v\n", err)
	// 	return "", err
	// }
	img, _, err := image.Decode(bytes.NewReader(getObject(path)))
	if err != nil {
		fmt.Printf("image.Decode error: %v\n", err)
		return "", err
	}
	qrCodes, err := goqr.Recognize(img)
	if err != nil {
		fmt.Printf("Recognize failed: %v\n", err)
		return "", err
	}
	for _, qrCode := range qrCodes {
		return string(qrCode.Payload), nil
	}
	return "", nil
}

func HandleRequest(ctx context.Context, event Event) (string, error) {
	return recognizeFile(event.S3ObjectKey)
}

func main() {
	lambda.Start(HandleRequest)
}
