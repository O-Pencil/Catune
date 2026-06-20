/*
 * sme2_min.c — 最小 SME2 兜底验证程序
 *
 * 证两件事：
 *   1) 运行时通过 HWCAP2 检测 CPU 是否暴露 SME / SME2（一定能编、能跑）。
 *   2) 若编译器按 SME march 编译，真正执行一条 SME 指令(smstart/smstop)，不触发 SIGILL = 已执行。
 *
 * 对比镜头：原生跑(M2 无 SME2 → SME2: no) vs `qemu-aarch64 -cpu max`(模拟 → SME2: yes + 指令 OK)。
 *
 * 编译：cc -O2 -march=armv9.2-a+sme2 sme2_min.c -o sme2_min   （toolchain 不支持 +sme2 则去掉，仅做检测）
 * 运行：./sme2_min                 # 原生
 *       qemu-aarch64 -cpu max ./sme2_min   # 模拟 SME2
 */
#include <stdio.h>
#include <sys/auxv.h>

#ifndef HWCAP2_SME
#define HWCAP2_SME (1UL << 23)
#endif
#ifndef HWCAP2_SME2
#define HWCAP2_SME2 (1UL << 37)
#endif

int main(void) {
    unsigned long h2 = getauxval(AT_HWCAP2);
    int has_sme = (h2 & HWCAP2_SME) != 0;
    int has_sme2 = (h2 & HWCAP2_SME2) != 0;

    printf("AT_HWCAP2 = 0x%lx\n", h2);
    printf("SME  : %s\n", has_sme ? "yes" : "no");
    printf("SME2 : %s\n", has_sme2 ? "yes" : "no");

#if defined(__ARM_FEATURE_SME)
    if (has_sme) {
        /* 进入再退出 streaming/ZA 模式：真正执行 SME 指令，不崩即证明 SME 在跑 */
        __asm__ volatile("smstart" ::: "memory");
        __asm__ volatile("smstop" ::: "memory");
        printf("SME instruction (smstart/smstop) executed OK\n");
    } else {
        printf("built with SME, but CPU reports no SME at runtime — skip instruction\n");
    }
#else
    printf("(binary built WITHOUT SME march; only feature detection above)\n");
#endif

    return has_sme2 ? 0 : 2;
}
