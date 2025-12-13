' Script name: AutoGain
' 
' It monitors the input which has AutoGain in the name
' and automatically adjusts the gain to prevent clipping or low volume.
' You can configure the clip and peak threshold values bellow.

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " AutoGain 0.0.4")

' Configuration | Decibels = 20 * Math.Log10(Amplitude)
Dim loopTime = 50
Dim clipThreshold As Double = 0.9  ' 0.9 ~ -1dB; meterF1 value to consider as clipping
Dim peakThreshold As Double = 0.45  ' 0.45 ~ -7dB; meterF1 value to consider as a loud enough voice 
Dim voiceThreshold As Double = 0.1  ' 0.1 ~ -20dB; meterF1 value to consider as voice present
Dim voiceDurationThreshold As Integer = 250  ' Time of continuous voice detection to consider as speaking
Dim peakWaitLimit As Integer = 5000  ' Time to wait after last peak detected before allowing gain increase
Dim gainUpTime As Integer = 3000  ' Minimum time between gain increases
Dim gainDownTime As Integer = 1000  ' Minimum time between gain decreases

Dim now As Double = 0
Dim voicePeakTimestamp As Double = 0  ' When translator last reached peakThreshold
Dim voiceThresholdTimestamp As Double = 0  ' When translator made sound above voiceThreshold
Dim voiceTimestamp As Double = 0  ' When translator continuously spoke above voiceThreshold for voiceDurationThreshold
Dim gainDownTimestamp As Double = 0
Dim gainUpTimestamp As Double = 0

Dim xml = New System.Xml.XmlDocument()

Do While True
    Sleep(loopTime)

    Try
        ' Load vMix XML
        xml.LoadXml(API.XML())
        now = (DateTime.Now - New DateTime(2000,1,1)).TotalMilliseconds

        ' Get Translator mic input node
        Dim micNode = xml.SelectSingleNode("//input[contains(@title, 'AutoGain')]")
        If micNode Is Nothing Then
            Console.WriteLine(timestamp & " AutoGain | No inputs have 'AutoGain' in the name.")
            Sleep(5000)
            Continue Do
        End If

        If micNode.Attributes("muted").Value = "True" Then
            ' Skip if muted
            Continue Do
        End If

        Dim meterF1 As Double = CDbl(micNode.Attributes("meterF1").Value)
        Dim inputNumber As String = micNode.Attributes("number").Value
        Dim gainDb As Integer = CInt(micNode.Attributes("gainDb").Value)

        If meterF1 > peakThreshold Then
            voicePeakTimestamp = now
        End If

        ' Detect voice only when it is present for a duration
        If meterF1 > voiceThreshold Then
            If voiceThresholdTimestamp = 0 Then
                voiceThresholdTimestamp = now
            ElseIf now - voiceThresholdTimestamp > voiceDurationThreshold Then
                voiceTimestamp = now
            End If
        Else
            ' For exploring purposes
            ' If voiceThresholdTimestamp <> 0 Then
            '     Console.WriteLine(voiceThresholdTimestamp - now)
            ' End If
            voiceThresholdTimestamp = 0
        End If

        If now - voicePeakTimestamp > peakWaitLimit And now - voiceTimestamp < peakWaitLimit And now - gainUpTimestamp > gainUpTime Then
            ' Increase gain if no peaks detected for gainUpTime and voice detected recently
            API.Function("SetGain", Input:=inputNumber, Value:=CStr(Math.Min(gainDb + 1, 24)))
            gainUpTimestamp = now
        End If

        If meterF1 > clipThreshold And now - gainDownTimestamp > gainDownTime And now - voiceTimestamp < peakWaitLimit Then
            ' Decrease gain to prevent clipping
            API.Function("SetGain", Input:=inputNumber, Value:=CStr(Math.Max(gainDb - 1, 0)))
            gainDownTimestamp = now
        End If

    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " AutoGain | Unexpected error: " & ex.Message)
    End Try
Loop