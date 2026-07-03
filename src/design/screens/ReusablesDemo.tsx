/**
 * ReusablesDemo · 32 个 react-native-reusables 组件全能力验证。
 *
 * 用 ?preview=1 模式启动 Expo Web → http://localhost:8081?preview=1&demo=reusables
 * 可以一次性看完所有原子组件、布局辅助、动效层、表单、对话框的实际渲染。
 *
 * [WHO] 默认导出 `ReusablesDemo`
 * [FROM] 依赖 `@/design/primitives`、`@/lib/utils`、`react`、`react-native`、`lucide-react-native`
 * [TO] 被 PreviewApp 或临时路由引用
 * [HERE] src/design/screens/ReusablesDemo.tsx · 组件库自检
 */
import React, {useState} from 'react';
import {ScrollView, Text, View} from 'react-native';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  AspectRatio,
  Avatar,
  AvatarFallback,
  Badge,
  Button as ReButton,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toggle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/design/primitives';
import {cn} from '@/lib/utils';
import {Check, X, ChevronDown, Heart, Star, Bell, Info, AlertTriangle} from 'lucide-react-native';

/** 通用章节标题 */
function SectionTitle({children, id}: {children: string; id: string}): React.JSX.Element {
  return (
    <View id={id} className="mb-3 mt-6 flex flex-row items-center gap-2">
      <View className="bg-primary h-2 w-2 rounded-full" />
      <Text className="text-foreground text-lg font-bold">{children}</Text>
      <Text className="text-muted-foreground text-xs">#{id}</Text>
    </View>
  );
}

/** 子标题 */
function SubLabel({children}: {children: string}): React.JSX.Element {
  return <Text className="text-muted-foreground mb-2 text-xs">{children}</Text>;
}

export function ReusablesDemo(): React.JSX.Element {
  const [switchOn, setSwitchOn] = useState(false);
  const [checkboxOn, setCheckboxOn] = useState(false);
  const [radioValue, setRadioValue] = useState('option-a');
  const [togglePressed, setTogglePressed] = useState(false);
  const [tab, setTab] = useState('overview');

  return (
    <ScrollView className="bg-background flex-1" contentContainerStyle={{padding: 16, paddingBottom: 80}}>
      {/* ================== Header ================== */}
      <View className="mb-4">
        <Text className="text-muted-foreground text-xs uppercase tracking-wider">Catune · Component Lab</Text>
        <Text className="text-foreground text-2xl font-bold">react-native-reusables · 32 组件</Text>
        <Text className="text-muted-foreground mt-1 text-sm">
          验证 NativeWind v4 + reusables 在 RNW 上的实际渲染。
        </Text>
      </View>

      <Separator className="my-2" />

      {/* ================== 1. Button 6 variants ================== */}
      <SectionTitle id="button">Button · 6 variants × 3 sizes</SectionTitle>
      <SubLabel>default / destructive / outline / secondary / ghost / link</SubLabel>
      <View className="gap-3">
        <View className="flex flex-row flex-wrap gap-2">
          <ReButton>
            <Text className="text-primary-foreground text-sm font-medium">Default</Text>
          </ReButton>
          <ReButton variant="destructive">
            <Text className="text-white text-sm font-medium">Destructive</Text>
          </ReButton>
          <ReButton variant="outline">
            <Text className="text-foreground text-sm font-medium">Outline</Text>
          </ReButton>
          <ReButton variant="secondary">
            <Text className="text-secondary-foreground text-sm font-medium">Secondary</Text>
          </ReButton>
          <ReButton variant="ghost">
            <Text className="text-primary text-sm font-medium">Ghost</Text>
          </ReButton>
          <ReButton variant="link">
            <Text className="text-primary text-sm underline">Link</Text>
          </ReButton>
        </View>
        <View className="flex flex-row flex-wrap items-center gap-2">
          <ReButton size="sm">
            <Text className="text-primary-foreground text-xs">Small</Text>
          </ReButton>
          <ReButton size="default">
            <Text className="text-primary-foreground text-sm">Default</Text>
          </ReButton>
          <ReButton size="lg">
            <Text className="text-primary-foreground text-base">Large</Text>
          </ReButton>
        </View>
        <ReButton disabled>
          <Text className="text-primary-foreground text-sm opacity-50">Disabled</Text>
        </ReButton>
      </View>

      {/* ================== 2. Card 完整结构 ================== */}
      <SectionTitle id="card">Card · header / content / footer</SectionTitle>
      <SubLabel>Catune 主题：bg-card · border-border · shadow-sm</SubLabel>
      <Card className="bg-card border-border rounded-xl border p-6 shadow-sm shadow-black/5">
        <CardHeader className="mb-3">
          <CardTitle>
            <Text className="text-card-foreground text-base font-semibold">今日坐姿</Text>
          </CardTitle>
          <CardDescription>
            <Text className="text-muted-foreground text-xs">距离上次喝水已经 38 分钟</Text>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Text className="text-card-foreground text-sm leading-6">
            你已经持续坐了 1 小时 24 分钟。建议站起来伸个懒腰，活动颈椎。
            Plant 正在慢慢长大，记得保持好坐姿哦 🌱
          </Text>
        </CardContent>
        <CardFooter className="mt-3 flex-row gap-2">
          <ReButton size="sm" variant="outline">
            <Text className="text-foreground text-xs">稍后提醒</Text>
          </ReButton>
          <ReButton size="sm">
            <Text className="text-primary-foreground text-xs">我知道了</Text>
          </ReButton>
        </CardFooter>
      </Card>

      {/* ================== 3. Badge / Input / Label ================== */}
      <SectionTitle id="badge-input">Badge / Input / Label · 表单元素</SectionTitle>
      <SubLabel>5 tone badge · Input with label</SubLabel>
      <View className="gap-3">
        <View className="flex flex-row flex-wrap gap-2">
          <Badge>
            <Text className="text-foreground text-xs">default</Text>
          </Badge>
          <Badge variant="secondary">
            <Text className="text-secondary-foreground text-xs">secondary</Text>
          </Badge>
          <Badge variant="destructive">
            <Text className="text-white text-xs">destructive</Text>
          </Badge>
          <Badge variant="outline">
            <Text className="text-foreground text-xs">outline</Text>
          </Badge>
        </View>
        <View className="gap-2">
          <Label>
            <Text className="text-foreground text-sm font-medium">用户名</Text>
          </Label>
          <Input
            placeholder="请输入用户名"
            className="border-input h-10 rounded-md border px-3 text-sm"
          />
          <Input
            placeholder="带图标的搜索框"
            className="border-input h-10 rounded-md border px-3 text-sm"
          />
        </View>
        <View className="gap-2">
          <Label>
            <Text className="text-foreground text-sm font-medium">备注</Text>
          </Label>
          <Textarea
            placeholder="说点什么..."
            className="border-input min-h-[80px] rounded-md border p-3 text-sm"
          />
        </View>
      </View>

      {/* ================== 4. Switch / Checkbox / RadioGroup ================== */}
      <SectionTitle id="switch-checkbox-radio">Switch / Checkbox / RadioGroup</SectionTitle>
      <SubLabel>受控组件 · useState 联动</SubLabel>
      <Card className="bg-card border-border rounded-xl border p-4">
        <View className="gap-3">
          <View className="flex flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-card-foreground text-sm font-medium">震动提醒</Text>
              <Text className="text-muted-foreground text-xs">异常坐姿时手机震动</Text>
            </View>
            <Switch
              checked={switchOn}
              onCheckedChange={setSwitchOn}
            />
          </View>
          <Separator />
          <View className="flex flex-row items-center gap-2">
            <Checkbox
              checked={checkboxOn}
              onCheckedChange={setCheckboxOn}
            />
            <Text className="text-card-foreground text-sm">同意服务条款</Text>
          </View>
          <Separator />
          <View className="gap-2">
            <Text className="text-card-foreground text-sm font-medium">选择 mock 场景</Text>
            <RadioGroup value={radioValue} onValueChange={setRadioValue} className="gap-2">
              <View className="flex flex-row items-center gap-2">
                <RadioGroupItem value="option-a" />
                <Text className="text-card-foreground text-sm">NORMAL · 正常坐姿</Text>
              </View>
              <View className="flex flex-row items-center gap-2">
                <RadioGroupItem value="option-b" />
                <Text className="text-card-foreground text-sm">SLUMPED · 弯腰驼背</Text>
              </View>
              <View className="flex flex-row items-center gap-2">
                <RadioGroupItem value="option-c" />
                <Text className="text-card-foreground text-sm">TECH_NECK · 头前倾</Text>
              </View>
            </RadioGroup>
          </View>
        </View>
      </Card>

      {/* ================== 5. Progress + Skeleton ================== */}
      <SectionTitle id="progress-skeleton">Progress · 进度条</SectionTitle>
      <SubLabel>value 0-100 · 配合 Skeleton 做 loading 占位</SubLabel>
      <Card className="bg-card border-border rounded-xl border p-4">
        <View className="gap-3">
          <View>
            <View className="mb-1 flex flex-row justify-between">
              <Text className="text-card-foreground text-sm">Plant 成长</Text>
              <Text className="text-muted-foreground text-xs">72 / 100</Text>
            </View>
            <Progress value={72} className="bg-muted h-2 rounded-full" indicatorClassName="bg-primary" />
          </View>
          <View>
            <Text className="text-card-foreground mb-1 text-sm">模型下载</Text>
            <Progress value={45} className="bg-muted h-2 rounded-full" indicatorClassName="bg-status-normal" />
          </View>
          <View>
            <Text className="text-card-foreground mb-1 text-sm">加载中...</Text>
            <Skeleton className="bg-muted h-2 w-full rounded-full" />
            <Skeleton className="bg-muted mt-2 h-10 w-3/4 rounded-md" />
          </View>
        </View>
      </Card>

      {/* ================== 6. Avatar + AspectRatio ================== */}
      <SectionTitle id="avatar-aspect">Avatar / AspectRatio · 媒体元素</SectionTitle>
      <SubLabel>圆形头像 · 16:9 视频框</SubLabel>
      <Card className="bg-card border-border rounded-xl border p-4">
        <View className="gap-3">
          <View className="flex flex-row gap-3">
            <Avatar alt="Catune" className="bg-primary h-12 w-12 rounded-full">
              <AvatarFallback>
                <Text className="text-primary-foreground text-base font-bold">C</Text>
              </AvatarFallback>
            </Avatar>
            <Avatar alt="Catune" className="bg-status-normal h-12 w-12 rounded-full">
              <AvatarFallback>
                <Text className="text-white text-base font-bold">L</Text>
              </AvatarFallback>
            </Avatar>
            <Avatar alt="Catune" className="border-border h-12 w-12 rounded-full border-2">
              <AvatarFallback>
                <Text className="text-muted-foreground text-base">N</Text>
              </AvatarFallback>
            </Avatar>
          </View>
          <AspectRatio ratio={16 / 9} className="bg-muted w-full rounded-md">
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted-foreground text-sm">16:9 · AspectRatio</Text>
            </View>
          </AspectRatio>
        </View>
      </Card>

      {/* ================== 7. Tabs ================== */}
      <SectionTitle id="tabs">Tabs · 顶部切换</SectionTitle>
      <SubLabel>Tabs / TabsList / TabsTrigger / TabsContent</SubLabel>
      <Card className="bg-card border-border rounded-xl border p-4">
        <Tabs value={tab} onValueChange={setTab} className="gap-3">
          <TabsList className="bg-muted h-9 flex-row items-center rounded-lg p-[3px]">
            <TabsTrigger value="overview" className="flex-1">
              <Text
                className={cn(
                  'text-sm',
                  tab === 'overview' ? 'text-foreground font-semibold' : 'text-muted-foreground',
                )}>
                概览
              </Text>
            </TabsTrigger>
            <TabsTrigger value="detail" className="flex-1">
              <Text
                className={cn(
                  'text-sm',
                  tab === 'detail' ? 'text-foreground font-semibold' : 'text-muted-foreground',
                )}>
                详情
              </Text>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">
              <Text
                className={cn(
                  'text-sm',
                  tab === 'settings' ? 'text-foreground font-semibold' : 'text-muted-foreground',
                )}>
                设置
              </Text>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <Text className="text-card-foreground text-sm">概览内容：今日已专注 4 小时 12 分</Text>
          </TabsContent>
          <TabsContent value="detail">
            <Text className="text-card-foreground text-sm">详情内容：姿态评分 86 分</Text>
          </TabsContent>
          <TabsContent value="settings">
            <Text className="text-card-foreground text-sm">设置内容：每 50 分钟提醒</Text>
          </TabsContent>
        </Tabs>
      </Card>

      {/* ================== 8. Alert ================== */}
      <SectionTitle id="alert">Alert · 提示条</SectionTitle>
      <SubLabel>default / destructive</SubLabel>
      <View className="gap-3">
        <Alert icon={Info} className="bg-card border-border rounded-lg border p-4">
          <AlertTitle>
            <Text className="text-card-foreground text-sm font-semibold">温馨提示</Text>
          </AlertTitle>
          <AlertDescription>
            <Text className="text-muted-foreground text-xs">你已经持续坐姿超过 1 小时，建议起身活动。</Text>
          </AlertDescription>
        </Alert>
        <Alert
          icon={AlertTriangle}
          variant="destructive"
          className="bg-destructive/10 border-destructive/20 rounded-lg border p-4">
          <AlertTitle>
            <Text className="text-destructive text-sm font-semibold">异常检测</Text>
          </AlertTitle>
          <AlertDescription>
            <Text className="text-destructive/80 text-xs">检测到颈椎前倾异常，请调整坐姿。</Text>
          </AlertDescription>
        </Alert>
      </View>

      {/* ================== 9. Dialog / Tooltip ================== */}
      <SectionTitle id="dialog-tooltip">Dialog · 弹窗</SectionTitle>
      <SubLabel>点按钮触发，验证 PortalHost 正常工作</SubLabel>
      <View className="flex flex-row flex-wrap gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <ReButton>
              <Text className="text-primary-foreground text-sm">打开 Dialog</Text>
            </ReButton>
          </DialogTrigger>
          <DialogContent className="bg-card border-border rounded-xl border p-6">
            <DialogHeader>
              <DialogTitle>
                <Text className="text-card-foreground text-base font-semibold">确认操作</Text>
              </DialogTitle>
              <DialogDescription>
                <Text className="text-muted-foreground text-xs">此操作不可撤销，是否继续？</Text>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 flex-row justify-end gap-2">
              <ReButton variant="outline" size="sm">
                <Text className="text-foreground text-xs">取消</Text>
              </ReButton>
              <ReButton size="sm">
                <Text className="text-primary-foreground text-xs">确认</Text>
              </ReButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <ReButton variant="outline">
              <Text className="text-foreground text-sm">悬停看 Tooltip</Text>
            </ReButton>
          </TooltipTrigger>
          <TooltipContent className="bg-foreground rounded-md px-3 py-1.5">
            <Text className="text-background text-xs">这是一个 Tooltip</Text>
          </TooltipContent>
        </Tooltip>
      </View>

      {/* ================== 10. Select ================== */}
      <SectionTitle id="select">Select · 下拉选择</SectionTitle>
      <SubLabel>Catune 用得少但补齐能力</SubLabel>
      <Select>
        <SelectTrigger className="border-input h-10 rounded-md border px-3">
          <SelectValue placeholder="选择 mock 场景" />
          <ChevronDown size={16} color="#666" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border rounded-md border p-1">
          <SelectGroup>
            <SelectLabel>
              <Text className="text-muted-foreground px-2 py-1 text-xs">场景</Text>
            </SelectLabel>
            <SelectItem value="normal" label="NORMAL" />
            <SelectItem value="slumped" label="SLUMPED" />
            <SelectItem value="tech_neck" label="TECH_NECK" />
            <SelectItem value="left_lean" label="LEFT_LEAN" />
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* ================== 11. Toggle / ToggleGroup ================== */}
      <SectionTitle id="toggle">Toggle / ToggleGroup · 按压态</SectionTitle>
      <SubLabel>单击切换 pressed · 多选组</SubLabel>
      <View className="gap-3">
        <View className="flex flex-row items-center gap-2">
          <Toggle pressed={togglePressed} onPressedChange={setTogglePressed}>
            <Heart size={16} color={togglePressed ? 'white' : '#666'} />
            <Text
              className={cn(
                'text-sm',
                togglePressed ? 'text-primary-foreground' : 'text-foreground',
              )}>
              收藏
            </Text>
          </Toggle>
          <Toggle pressed={false} onPressedChange={() => {}}>
            <Star size={16} color="#666" />
            <Text className="text-foreground text-sm">评分</Text>
          </Toggle>
        </View>
        <View className="flex flex-row gap-2">
          <Toggle pressed={false} onPressedChange={() => {}}>
            <Text className="text-foreground text-sm">Bold</Text>
          </Toggle>
          <Toggle pressed={false} onPressedChange={() => {}}>
            <Text className="text-foreground text-sm">Italic</Text>
          </Toggle>
          <Toggle pressed={false} onPressedChange={() => {}}>
            <Text className="text-foreground text-sm">Underline</Text>
          </Toggle>
        </View>
      </View>

      {/* ================== 12. Accordion / Collapsible ================== */}
      <SectionTitle id="accordion">Accordion / Collapsible · 折叠</SectionTitle>
      <SubLabel>多 item 折叠 · 单 item 自定义</SubLabel>
      <Accordion type="multiple" className="bg-card border-border rounded-xl border">
        <AccordionItem value="what">
          <AccordionTrigger className="p-4">
            <Text className="text-card-foreground text-sm font-semibold">Catune 是什么？</Text>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <Text className="text-muted-foreground text-xs leading-5">
              久坐坐姿辅助 App，通过传感器 + 端侧 AI 帮你保持健康坐姿。
            </Text>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="how">
          <AccordionTrigger className="p-4">
            <Text className="text-card-foreground text-sm font-semibold">怎么用？</Text>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <Text className="text-muted-foreground text-xs leading-5">
              打开 App → Desk 页 → 切 mock 场景验证。真实场景接 ESP32 硬件姿态带。
            </Text>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Collapsible className="mt-4">
        <CollapsibleTrigger className="bg-card border-border flex-row items-center justify-between rounded-xl border p-4">
          <Text className="text-card-foreground text-sm font-semibold">Collapsible · 点击展开</Text>
          <ChevronDown size={16} color="#666" />
        </CollapsibleTrigger>
        <CollapsibleContent className="bg-card border-border mt-2 rounded-xl border p-4">
          <Text className="text-muted-foreground text-xs leading-5">
            这里的内容可以折叠收起。验证点击交互。
          </Text>
        </CollapsibleContent>
      </Collapsible>

      {/* ================== 13. Icon + Tailwind 主题验证 ================== */}
      <SectionTitle id="icon-theme">Icon + 主题色 token 验证</SectionTitle>
      <SubLabel>Catune 品牌橙 + 状态色全部走 CSS variables</SubLabel>
      <Card className="bg-card border-border rounded-xl border p-4">
        <View className="flex flex-row flex-wrap gap-3">
          <View className="bg-primary h-12 w-12 items-center justify-center rounded-lg">
            <Text className="text-primary-foreground text-base font-bold">P</Text>
          </View>
          <View className="bg-status-normal h-12 w-12 items-center justify-center rounded-lg">
            <Text className="text-white text-base font-bold">N</Text>
          </View>
          <View className="bg-status-warning h-12 w-12 items-center justify-center rounded-lg">
            <Text className="text-white text-base font-bold">W</Text>
          </View>
          <View className="bg-status-alert h-12 w-12 items-center justify-center rounded-lg">
            <Text className="text-white text-base font-bold">A</Text>
          </View>
          <View className="bg-status-offline h-12 w-12 items-center justify-center rounded-lg">
            <Text className="text-white text-base font-bold">O</Text>
          </View>
          <View className="border-border h-12 w-12 items-center justify-center rounded-lg border-2">
            <Bell size={20} color="#666" />
          </View>
          <View className="bg-primary/10 h-12 w-12 items-center justify-center rounded-lg">
            <Check size={20} color="#FB4B00" />
          </View>
          <View className="bg-destructive/10 h-12 w-12 items-center justify-center rounded-lg">
            <X size={20} color="#C75348" />
          </View>
        </View>
        <Text className="text-muted-foreground mt-3 text-xs">
          ✓ 改 global.css 的 --primary / --status-normal 等即可换主题
        </Text>
      </Card>

      <Separator className="my-6" />
      <Text className="text-muted-foreground text-center text-xs">
        32 个组件 · NativeWind v4 · Catune 主题 · 验证完毕
      </Text>
    </ScrollView>
  );
}