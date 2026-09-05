import Foundation
import Capacitor
import UIKit
import LinkPresentation

@objc(LiveActivityPlugin)
public class LiveActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LiveActivityPlugin"
    public let jsName = "LiveActivityPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "downloadAndOpenIPA", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancelDownload", returnType: CAPPluginReturnPromise)
    ]

    private var activeDownloader: IPADownloadManager?

    @objc public func downloadAndOpenIPA(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"), let url = URL(string: urlString) else {
            call.reject("URL không hợp lệ")
            return
        }

        let fileName = url.lastPathComponent.isEmpty ? "PlankAI-Update.ipa" : url.lastPathComponent
        let destinationUrl = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)
        try? FileManager.default.removeItem(at: destinationUrl)

        self.activeDownloader = IPADownloadManager()
        self.activeDownloader?.onProgress = { [weak self] progress, downloaded, total, speed in
            self?.notifyListeners("ipaDownloadProgress", data: [
                "progress": progress,
                "downloadedBytes": downloaded,
                "totalBytes": total,
                "downloadedMB": String(format: "%.1f", Double(downloaded) / 1024.0 / 1024.0),
                "totalMB": String(format: "%.1f", Double(total) / 1024.0 / 1024.0),
                "speed": speed
            ])
        }

        self.activeDownloader?.onCompletion = { [weak self] localUrl, error in
            if let error = error {
                DispatchQueue.main.async { call.reject("Lỗi tải: \(error.localizedDescription)") }
                return
            }
            guard let localUrl = localUrl else {
                DispatchQueue.main.async { call.reject("Không tìm thấy file") }
                return
            }

            do {
                try FileManager.default.moveItem(at: localUrl, to: destinationUrl)

                DispatchQueue.main.async {
                    guard let self = self, let viewController = self.bridge?.viewController else {
                        call.resolve(["success": true, "path": destinationUrl.path])
                        return
                    }

                    // Mở giao diện chia sẻ iOS Share Sheet với tiêu đề tiếng Việt
                    let shareSource = IPAShareItemSource(fileUrl: destinationUrl)
                    let activityVC = UIActivityViewController(activityItems: [shareSource], applicationActivities: nil)
                    
                    // Chống crash trên iPad
                    if let popover = activityVC.popoverPresentationController {
                        popover.sourceView = viewController.view
                        popover.sourceRect = CGRect(x: viewController.view.bounds.midX, y: viewController.view.bounds.midY, width: 0, height: 0)
                        popover.permittedArrowDirections = []
                    }
                    viewController.present(activityVC, animated: true)
                    call.resolve(["success": true, "path": destinationUrl.path])
                }
            } catch {
                DispatchQueue.main.async { call.reject("Lỗi lưu file: \(error.localizedDescription)") }
            }
        }

        self.activeDownloader?.startDownload(from: url)
    }

    @objc public func cancelDownload(_ call: CAPPluginCall) {
        self.activeDownloader?.cancel()
        self.activeDownloader = nil
        call.resolve(["success": true])
    }
}

// MARK: - IPADownloadManager (Tính toán tiến trình % và tốc độ MB/s)
class IPADownloadManager: NSObject, URLSessionDownloadDelegate {
    var onProgress: ((Double, Int64, Int64, String) -> Void)?
    var onCompletion: ((URL?, Error?) -> Void)?
    private var downloadSession: URLSession?
    private var downloadTask: URLSessionDownloadTask?
    private var lastSpeedCalculationTime: Date = Date()
    private var lastBytesCount: Int64 = 0
    private var currentSpeedStr: String = "0 KB/s"

    func startDownload(from url: URL) {
        let config = URLSessionConfiguration.default
        downloadSession = URLSession(configuration: config, delegate: self, delegateQueue: nil)
        lastSpeedCalculationTime = Date()
        lastBytesCount = 0
        currentSpeedStr = "0 KB/s"
        downloadTask = downloadSession?.downloadTask(with: url)
        downloadTask?.resume()
    }

    func cancel() {
        onProgress = nil
        onCompletion = nil
        downloadTask?.cancel()
        downloadSession?.invalidateAndCancel()
        downloadSession = nil
        downloadTask = nil
    }

    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {
        onCompletion?(location, nil)
    }

    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didWriteData bytesWritten: Int64, totalBytesWritten: Int64, totalBytesExpectedToWrite: Int64) {
        let now = Date()
        let timeInterval = now.timeIntervalSince(lastSpeedCalculationTime)
        if timeInterval >= 0.4 {
            let bytesDiff = totalBytesWritten - lastBytesCount
            let bytesPerSec = Double(bytesDiff) / timeInterval
            if bytesPerSec >= 1024.0 * 1024.0 {
                currentSpeedStr = String(format: "%.1f MB/s", bytesPerSec / 1024.0 / 1024.0)
            } else {
                currentSpeedStr = String(format: "%.0f KB/s", bytesPerSec / 1024.0)
            }
            lastSpeedCalculationTime = now
            lastBytesCount = totalBytesWritten
        }

        let progress = totalBytesExpectedToWrite > 0 ? Double(totalBytesWritten) / Double(totalBytesExpectedToWrite) : 0.0
        onProgress?(progress, totalBytesWritten, totalBytesExpectedToWrite, currentSpeedStr)
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        if let error = error {
            onCompletion?(nil, error)
        }
    }
}

// MARK: - IPAShareItemSource (Tùy biến tiêu đề tiếng Việt trên iOS Share Sheet)
class IPAShareItemSource: NSObject, UIActivityItemSource {
    let fileUrl: URL
    
    init(fileUrl: URL) {
        self.fileUrl = fileUrl
        super.init()
    }
    
    func activityViewControllerPlaceholderItem(_ activityViewController: UIActivityViewController) -> Any {
        return fileUrl
    }
    
    func activityViewController(_ activityViewController: UIActivityViewController, itemForActivityType activityType: UIActivity.ActivityType?) -> Any? {
        return fileUrl
    }
    
    func activityViewController(_ activityViewController: UIActivityViewController, subjectForActivityType activityType: UIActivity.ActivityType?) -> String {
        return "Bản cập nhật Plank AI (TrollStore)"
    }
    
    @available(iOS 13.0, *)
    func activityViewControllerLinkMetadata(_ activityViewController: UIActivityViewController) -> LPLinkMetadata? {
        let metadata = LPLinkMetadata()
        metadata.title = "Cài đặt bản cập nhật Plank AI"
        metadata.originalURL = fileUrl
        return metadata
    }
}
