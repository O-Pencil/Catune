/**
 * Card 适配 Catune 老 API：4 边统一 padding(theme.spacing.lg = 16px)。
 *
 * 区别于 shadcn 默认 Card（外层只 py-6，内部 header/content/footer 自己加 px-6）：
 * Catune 老 Card 是 `<Card>直接放内容</Card>`，padding 由外层统一管理。
 *
 * 子组件 CardHeader / CardContent / CardFooter 不再强制加 px-6，
 * 直接继承外层 padding。CardTitle / CardDescription 文字样式保持不变。
 */
import {Text, TextClassContext} from '@/design/primitives/text';
import {cn} from '@/lib/utils';
import {View} from 'react-native';

function Card({className, ...props}: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return (
    <TextClassContext.Provider value="text-card-foreground">
      <View
        className={cn(
          'bg-card border-border flex flex-col gap-4 rounded-xl border p-4 shadow-sm shadow-black/5',
          className,
        )}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

function CardHeader({className, ...props}: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return <View className={cn('flex flex-col gap-1.5', className)} {...props} />;
}

function CardTitle({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<typeof Text>) {
  return (
    <Text
      ref={ref}
      role="heading"
      aria-level={3}
      className={cn('font-semibold leading-none', className)}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<typeof Text>) {
  return <Text className={cn('text-muted-foreground text-sm', className)} {...props} />;
}

function CardContent({className, ...props}: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return <View className={cn('', className)} {...props} />;
}

function CardFooter({className, ...props}: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return <View className={cn('flex flex-row items-center', className)} {...props} />;
}

export {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle};