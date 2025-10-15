"use client"

import { useEffect, useRef } from "react"
import { View, StyleSheet, Animated } from "react-native"
import { LinearGradient } from 'expo-linear-gradient';
const AnimatedDot = ({ delay = 0 }: { delay?: number }) => {
  const bounceAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 300,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    )

    animation.start()

    return () => animation.stop()
  }, [bounceAnim, delay])

  return (
    <Animated.View
      style={{
        transform: [{ translateY: bounceAnim }],
      }}
    >
      <LinearGradient colors={["#2F9A92", "#2C72FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.dot} />
    </Animated.View>
  )
}

const Loader = () => {
  return (
    <View style={styles.container}>
      <View style={styles.dotsContainer}>
        <AnimatedDot delay={0} />
        <AnimatedDot delay={160} />
        <AnimatedDot delay={320} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginVertical: 16,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
})

export { Loader }
