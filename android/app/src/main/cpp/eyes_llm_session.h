#pragma once

#include <mutex>
#include <string>
#include <unordered_map>

namespace eyes {

class EyesLlmSession {
public:
    bool load(const std::string& config_json_path, const std::string& cache_dir);
    void unload();
    bool isReady() const { return ready_; }
    const std::string& lastError() const { return last_error_; }

    std::string infer(
        const std::string& user_prompt,
        const std::string& image_jpeg_path,
        const std::string& audio_wav_path);

    std::string getMetric(const std::string& key) const;

private:
    mutable std::mutex mutex_;
    bool ready_ = false;
    std::string cache_dir_;
    std::string last_error_;
    std::unordered_map<std::string, std::string> metrics_;

    void* llm_ = nullptr;  // MNN::Transformer::Llm*
};

}  // namespace eyes
