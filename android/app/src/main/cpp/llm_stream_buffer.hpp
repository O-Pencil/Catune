#pragma once
#include <functional>
#include <ostream>
#include <streambuf>

class LlmStreamBuffer : public std::streambuf {
public:
    using CallBack = std::function<void(const char*, size_t)>;

    explicit LlmStreamBuffer(CallBack callback) : callback_(std::move(callback)) {}

protected:
    std::streamsize xsputn(const char* s, std::streamsize n) override {
        if (callback_) {
            callback_(s, static_cast<size_t>(n));
        }
        return n;
    }

private:
    CallBack callback_ = nullptr;
};
