import Foundation
import Cocoa
import Vision

func recognizeText(in image: NSImage) {
    guard let tiffData = image.tiffRepresentation,
          let bitmapImage = NSBitmapImageRep(data: tiffData),
          let cgImage = bitmapImage.cgImage else {
        print("ERROR: Could not get CGImage from input")
        exit(1)
    }

    let request = VNRecognizeTextRequest { (request, error) in
        if let error = error {
            print("ERROR: \(error.localizedDescription)")
            exit(1)
        }

        guard let observations = request.results as? [VNRecognizedTextObservation] else {
            print("")
            exit(0)
        }

        let recognizedStrings = observations.compactMap { observation in
            observation.topCandidates(1).first?.string
        }

        let fullText = recognizedStrings.joined(separator: "\n")
        print(fullText)
        exit(0)
    }

    request.recognitionLevel = .accurate
    request.recognitionLanguages = ["es", "en", "fr", "de", "it", "pt", "zh", "ja"]
    request.usesLanguageCorrection = true

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    do {
        try handler.perform([request])
    } catch {
        print("ERROR: \(error.localizedDescription)")
        exit(1)
    }
}

// Check arguments: if file path passed, read file; otherwise read from NSPasteboard
let args = CommandLine.arguments
if args.count > 1 {
    let filePath = args[1]
    if let image = NSImage(contentsOfFile: filePath) {
        recognizeText(in: image)
    } else {
        print("ERROR: Cannot load image at \(filePath)")
        exit(1)
    }
} else {
    // Read from clipboard
    let pasteboard = NSPasteboard.general
    if let image = NSImage(pasteboard: pasteboard) {
        recognizeText(in: image)
    } else {
        print("ERROR: No image in clipboard")
        exit(1)
    }
}

// Keep runloop alive for async recognition
RunLoop.main.run(until: Date(timeIntervalSinceNow: 5.0))
